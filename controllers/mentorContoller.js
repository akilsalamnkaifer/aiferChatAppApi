const ChatUser = require('../models/ChatUser');

const getChatUserBySubject = async (req, res) => {
  const subject = req.body.subject;
  if (!subject) {
    return res.status(400).send('Subject query parameter is required');
  }

  try {
    const chats = await ChatUser.find({ subject });

    // Separate users into three lists: group, mentors and students
    const group = chats.filter(chat => chat.isGroup);
    const mentors = chats.filter(chat => chat.isMentor);
    const students = chats.filter(chat => !chat.isMentor && !chat.isGroup);

    res.json({
      success: true,
      data: {
        group,
        mentors,
        students,
      }
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  getChatUserBySubject,
};
