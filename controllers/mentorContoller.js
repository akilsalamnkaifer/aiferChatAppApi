const Mentor = require('../models/Mentor');

const getMentorBySubject = async (req, res) => {
  const subject = req.body.subject;
  const isGroup = req.body.isGroup;
  if (!subject) {
    return res.status(400).send('Subject query parameter is required');
  }

  try {
    const mentors = await Mentor.find({ subject });
    res.json({ success: true, data: mentors });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  getMentorBySubject,
};
