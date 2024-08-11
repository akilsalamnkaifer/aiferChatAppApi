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
    default: () => {
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
      return new Date(now.getTime() + istOffset);
    },
  }
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
