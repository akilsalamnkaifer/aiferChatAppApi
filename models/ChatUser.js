const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ChatUserSchema = new Schema({
  name: String,
  profile: String,
  number: String,
  isGroup: { type: Boolean },
  isMentor: { type: Boolean },
  subject: String,
});

const ChatUser = mongoose.model('chatUser', ChatUserSchema);

module.exports = ChatUser;