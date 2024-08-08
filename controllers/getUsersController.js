const ChatUser = require('../models/ChatUser');
const { db, checkConnection } = require('../config/sqlDb');

const getChatUserBySubject = async (req, res) => {

  const subject = req.body.subject;

  if (!subject) {
    console.error('No subject provided in the request body.');
    return res.status(400).json({ message: 'Subject is required' });
  }

  try {
    // Fetch UIDs from user_courses based on the subject
    const userCourses = await db('SELECT uid FROM user_courses WHERE course_id = ?', [subject]);

    // Extract the UIDs from the result
    const uids = userCourses.map((row) => row.uid);

    console.log("uids: ", uids);

    // Check if there are any UIDs
    if (uids.length === 0) {
      // Respond with empty arrays if no users are found
      return res.json({ mentors: [], students: [] });
    }

    // Fetch users from dot_users based on the UIDs
    const query = 'SELECT * FROM dot_users WHERE firebase_uid IN (?)';
    const users = await db(query, [uids]);

    // Categorize users
    const mentors = users.filter((user) => user.user_type === 'mentor');
    const students = users.filter((user) => user.user_type === 'student');

    // Respond with categorized users
    res.json({ mentors, students });
  } catch (error) {
    console.error('Error fetching or processing users:', error.message);
    // Respond with an error message
    res.status(500).json({ message: 'Error fetching users' });
  }
};


module.exports = {
  getChatUserBySubject,
};
