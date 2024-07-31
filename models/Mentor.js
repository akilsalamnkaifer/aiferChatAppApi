const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MentorSchema = new Schema({
  name: String,
  profile: String,
  number: String,
  subject: String,
});

const Mentor = mongoose.model('Mentor', MentorSchema);

module.exports = Mentor;
