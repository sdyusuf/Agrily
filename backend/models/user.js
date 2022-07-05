const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

//defining user schema
const userSchema = mongoose.Schema({
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isVerified: {type: Boolean, default: false},
  verificationString: {type: String, required: true},
  passwordResetCode: {type: String},
} );

//plugging unique validator to user schema
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);