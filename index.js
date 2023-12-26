const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('./config/database').connect();
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const userModel = require('../database/model/user-model');
const User = require('../database/model/user-model');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get('/', async (req, res) => {
  console.log('client connected');
  res.status(201).json({ message: 'connected' });
});

app.get('/test', async (req, res) => {
  res.send('Test test!!');
});

const user = require('./operations/user-operations');

app.get('/users/:username', user.getUserinfo);
app.get('/users', user.getUsersDetail);
app.get('/posts', user.getPosts);

app.get('/users/email/:email', user.checkEmailExistence);
app.post('/signup', user.addUser);
app.post('/login', user.loginUser);
app.delete('/users/:email', user.removeUser);
app.patch('/users/:useremail', user.updateUser);
app.delete('/users/:username/images/:imagePath', user.deleteUserImage);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileType = file.mimetype.split('/')[1];
    const filename = `${uniqueSuffix}.${fileType}`;
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

app.post("/users/:username/upload-files", upload.array("files", 10), uploadFiles);

async function uploadFiles(req, res) {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      path: file.path,
      approved: 'false',
    }));

    user.images = user.images.concat(files);

    await user.save();

    console.log("Files uploaded successfully");

    res.json({ message: "Successfully uploaded files", redirectURL: `/users/${username}/uploads` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

app.use('/uploads', express.static('uploads'));

app.get('/users/:username/uploads', user.getUserUploads);

app.get('/users/sort/:sort', user.sortUser);

app.post('/users/:username/images/approve', user.approvePost);
app.post('/users/search', user.searchUser);
app.post('/posts/search/:username', user.searchPostsApproval);
app.post('/postsp/search/:username', user.searchPosts);


const PORT = 4500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
