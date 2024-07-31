const Message = require('../models/Message');

const allMessages = async (req, res) => {
    const chatId = req.body.chatId;
    try {
        const messages = await Message.find({ chat: chatId });
        if (!messages) {
            res.status(404).json({ success: false, message: "No messages found for this chat." });
        } else {
            res.json({ success: true, data: messages });
        }
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || "An error occurred" });
    }
};


const sendMessage = async (req,res) => {
    const { sender, content, chatId, isImage, isVoice } = req.body;

    if (!sender ||!content || !chatId ||!isImage ||!isVoice) {
        res.json({ success: false, message: "all body required" });
        return res.sendStatus(400);
    }

    var newMessage = {
        sender: sender,
        content: content,
        chat: chatId,
        isImage: isImage,
        isVoice: isVoice
    };

    try {
        var message = await Message.create(newMessage);

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }

}

module.exports = {
    allMessages,
    sendMessage
};
