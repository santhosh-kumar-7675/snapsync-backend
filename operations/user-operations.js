const userModel = require('../model/user-model');
const bcrypt  = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user-model');
const path = require('path');
const fs = require('fs/promises');

const addUser = async (req, res) => {
    try {
        const { username, email, phone, password, role } = req.body;
        if (!(username && email && phone && password)) {
            res.status(400).send({ message: "All inputs required" });
            return;
        }
        encryptedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            username,
            email,
            phone,
            password: encryptedPassword,
            role: role || 'user',
        });

        user.message = "Registered Successfully";
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
        res.status(400).send({ message: "Invalid Credentials" });
    }
};

const getUsersDetail = async (req,res) =>{
    try {
        const users = await userModel.find({role: 'user'}, { password: 0 ,   "__v": 0});
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}

const getUserinfo = async (req, res) =>{
    try {
        const username = req.params.username;
        const user = await userModel.findOne({ username }, { password: 0 ,   "__v": 0});

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}
const removeUser = async (req, res) => {
    try {
        const userEmail = req.params.email;
        const deletedUser = await userModel.findOneAndDelete({  email: userEmail });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User removed successfully', user: deletedUser });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
};


const updateUser = async (req, res) => {
    try {
        const userEmail = req.params.useremail; 
        const { newUsername, newPhone } = req.body;
        const user = await userModel.findOne({ email: userEmail }); 

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (newUsername) user.username = newUsername;
        if (newPhone) user.phone = newPhone;

        await user.save();

        res.status(200).json({ message: 'User updated successfully', updatedUser: user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
};

const sortUser= async (req, res) => {
    const type = req.params.sort;
    if(type == 'az'){
        try {
    
            const users = await userModel.find({}, { password: 0, "__v": 0 }).sort({ username: 1 });
    
            res.status(200).json(users);
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    }
    else if(type == 'za'){
        try {
            const users = await userModel.find({}, { password: 0, "__v": 0 }).sort({ username: -1 });
            res.status(200).json(users);
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: 'Internal Server Error' });
        }
    }
    else{
        res.status(400).send({message:'give valid sorting type: az or za'});
    }
};

const checkEmailExistence = async (req, res) => {
    try {
      const email = req.params.email;
      const existingUser = await userModel.findOne({ email });
      res.status(200).json(existingUser ? [existingUser] : []);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Internal Server Error' });
    }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await userModel.findOne({ username });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    const secretKey = process.env.JWT_SECRET || 'your_default_secret_key';
    const expiresIn = '1h';

    const token = jwt.sign({ username: user.username }, secretKey, { expiresIn });

    res.status(200).json({ token, role: user.role, username: user.username });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
  
async function getUserUploads(req, res) {
    try {
      const { username } = req.params;
  
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.json({ images: user.images, videos: user.videos });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
}
  
const getPosts = async (req, res) => {
    try {
      const usersWithPosts = await userModel.find({role:'user'}, { username: 1, images: 1, _id: 0 });
  
      res.status(200).json(usersWithPosts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
};
  

const deleteUserImage = async (req, res) => {
    try {
      const { username, imagePath } = req.params;
  
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const imageIndex = user.images.findIndex((img) => img.path === imagePath);
  
      if (imageIndex === -1) {
        return res.status(404).json({ message: 'Image not found' });
      }
  
      const imagePathOnServer = path.join(__dirname, '..', 'uploads', user.images[imageIndex].filename);
  
      await fs.unlink(imagePathOnServer);
  
      user.images.splice(imageIndex, 1);
  
      await user.save();
  
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
};

async function approvePost(req, res) {
  try {
    const { username } = req.params;
    const { filename, approved } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = user.images.find((image) => image.filename === filename);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.approved = approved;

    await user.save();

    res.json({ message: 'Post approval status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

const searchUser = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await userModel.findOne({ username }, { password: 0, "__v": 0 });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
};
const searchPostsApproval = async (req, res) => {
  try {
    const { username } = req.params;

    const users = await userModel.find({ username: { $regex: new RegExp(username, 'i') } });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }

    const usersWithPosts = users.map((user) => ({
      username: user.username,
      posts: user.images.map((image) => ({
        path: image.path,
        filename: image.filename,
        approved: image.approved, 
      })),
    }));

    res.status(200).json(usersWithPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const searchPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const users = await userModel.find({ username: { $regex: new RegExp(username, 'i') } });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }
    res.status(200).json(users);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


module.exports = {
    addUser,
    getUserinfo,
    getUsersDetail,
    removeUser,
    updateUser,
    sortUser,
    checkEmailExistence,
    loginUser, 
    getUserUploads,
    getPosts,
    deleteUserImage,
    approvePost,
    searchPostsApproval, 
    searchUser,
    searchPosts,
};