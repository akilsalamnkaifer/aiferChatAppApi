const Message = require('../models/Message');
const { io } = require('../index'); // Ensure the path is correct

const allMessages = async (req, res) => {
  const chatId = req.body.chatId;
  try {
    const messages = await Message.find({ chat: chatId });
    if (messages.length === 0) {
      return res.status(404).json({ success: false, message: "No messages found for this chat." });
    }
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "An error occurred" });
  }
};

const sendMessage = async (req, res) => {
    const { sender, content, chatId } = req.body;
  
    if (!sender || !content || !chatId) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
  
    var newMessage = {
      sender: sender,
      content: content,
      chat: chatId,
    };
  
    try {
      var message = await Message.create(newMessage);
  
      // Debugging statement
      console.log('io instance:', io);
  
      // Emit the message to all users in the specific chat room
      if (io) {
        io.to(chatId).emit('newMessage', message);
      } else {
        console.error('io is not defined');
      }
  
      res.json({ success: true, data: message });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message || "An error occurred" });
    }
  };
  
module.exports = {
  allMessages,
  sendMessage
};
