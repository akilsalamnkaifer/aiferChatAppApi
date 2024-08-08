const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  subject: String,
  users:[
    {
        type: String,
        ref:"User",
    }
],
});

const Chat = mongoose.model('Chat', ChatSchema);

module.exports = Chat;