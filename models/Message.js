const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  sourceId: {
    type: String,
    required: true,
  },
  chatId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  isImage: {
    type: Boolean,
  },
  isPdf: {
    type: Boolean,
  },
  isVoice: {
    type: Boolean,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});


const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
