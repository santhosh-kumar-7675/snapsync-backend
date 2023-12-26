const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, trim: true },
  images: [
    {
      filename: { type: String, required: true },
      originalname: { type: String, required: true },
      path: { type: String, required: true },
      approved: {type: Boolean, required: true},
    },
  ],

  role: { type: String, required: true, trim: true },
});

// You can add any pre-save logic here if needed
// For example, hashing the password before saving
// userSchema.pre('save', function(next) {
//   // Your logic here
//   next();
// });

module.exports = mongoose.model('UserDetails', userSchema);
