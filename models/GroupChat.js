const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const GroupChatSchema = new Schema({
  subject: String,
  users:[
    {
        type: String,
        ref:"User",
    }
],
});

const GroupChat = mongoose.model('GroupChat', GroupChatSchema);

module.exports = GroupChat;