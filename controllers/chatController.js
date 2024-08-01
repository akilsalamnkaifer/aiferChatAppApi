const Chat = require('../models/Chat');

const createChatBox = async (req, res) => {
  const { users } = req.body;

  if (!users || users.length === 0) {
    return res.status(400).send('There are no users');
  }

  try {
    // Check if a chat already exists with the same users
    let chat = await Chat.findOne({ users: { $all: users, $size: users.length } });

    if (chat) {
      return res.status(200).json({ success: true, data: chat, message: "already exist" });
    }

    // If no chat exists, create a new one
    chat = new Chat({ users });
    await chat.save();

    res.status(200).json({ success: true, data: chat, message: "created new" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createChatBox,
};
