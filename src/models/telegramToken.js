// models/uniqueCode.js
const mongoose = require('mongoose');

const TelegramTokenSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model('UniqueCode', TelegramTokenSchema);
