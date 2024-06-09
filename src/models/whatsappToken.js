const { sign } = require('jsonwebtoken');
const mongoose = require('mongoose');

const WhatsappUserTokenSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  userNumber: {
    type:  String,
    required: false,
  },
  signkey : {
    type: String,
    required: true,
  },
  isLinked: {
    type: Boolean,
    required: true,
    default: false,
  },
  sessionStartedAt: {
    type: Date,
    required: false,
  },
 
});

module.exports = mongoose.model('WhatsappUserToken', WhatsappUserTokenSchema);
