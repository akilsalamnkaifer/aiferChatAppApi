const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    sender: {
        type: String,
        ref: "User"
    },
    content: {
        type: String,
        // trim: true, 
    },
    chat: {
        type: String,
        ref: "Chat"
    }
},
{
    timestamps: true
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
