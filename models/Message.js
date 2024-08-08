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
  isImage: {
    type: Boolean,
  }
});


const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
