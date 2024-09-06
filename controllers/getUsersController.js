const { default: axios } = require('axios');
const { db, checkConnection } = require('../config/sqlDb');


const getAllDatesForDayInMonth = (day, startDate) => {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = daysOfWeek.indexOf(day.toLowerCase());

  if (targetDay === -1) {
    throw new Error('Invalid day of the week');
  }

  const dates = [];
  const today = new Date(startDate);
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + 1); 

  while (today <= endDate) {
    const dayDifference = (targetDay - today.getDay() + 7) % 7;
    today.setDate(today.getDate() + dayDifference);

    if (today > endDate) break; 

    dates.push(new Date(today)); 
    today.setDate(today.getDate() + 7); 
  }

  return dates.map(date => date.toISOString());
};

const convertTo24HourFormat = (time) => {
  const [timePart, modifier] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);

  if (modifier === 'PM' && hours < 12) {
    hours += 12;
  } else if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};


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

const AddReminder = async (req, res) => {
  const { uid, day, time } = req.body;
  try {
    const dates = getAllDatesForDayInMonth(day, new Date());
    const time24Hour = convertTo24HourFormat(time);
    console.log(time24Hour);
    
    const [hours, minutes] = time24Hour.split(':').map(Number);

    const checkExistence = `SELECT id, onesignal_id FROM student_study_reminder WHERE uid = '${uid}' AND day = '${day}'`;
    const existingReminder = await db(checkExistence);

    if (existingReminder.length > 0) {
      const { onesignal_id } = existingReminder[0];
      if (onesignal_id) {
        try {
          await axios.delete(
            `https://onesignal.com/api/v1/notifications/${onesignal_id}?app_id=${process.env.ONE_SIGNAL_APP_ID}`,
            {
              headers: {
                Authorization: `${process.env.ONE_SIGNAL_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (error) {
          console.log(`Failed to cancel existing notification with id ${onesignal_id}:`, error.response ? error.response.data : error.message);
        }
      }

      const deleteOldData = `DELETE FROM student_study_reminder WHERE uid = '${uid}' AND day = '${day}'`;
      await db(deleteOldData);
    }

    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(now.getMonth() + 1);

    for (const date of dates) {
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(hours, minutes, 0);

      const isoDateTime = scheduledDateTime.toISOString();

      // const scheduledDateTime = new Date(date);
      // scheduledDateTime.setUTCHours(hours, minutes, 0, 0);
      // const isoDateTime = scheduledDateTime.toISOString();

      console.log(isoDateTime);
      


      try {
        const response = await axios.post(
          'https://onesignal.com/api/v1/notifications',
          {
            app_id: process.env.ONE_SIGNAL_APP_ID,
            contents: {
              en: `Your study session is scheduled to begin at ${time} on ${day}. Stay focused and make the most of your study time!`,
            },
            headings: { en: "Hey, it's time to study!" },
            include_external_user_ids: [uid],
            send_after: isoDateTime,
          },
          {
            headers: {
              Authorization: `${process.env.ONE_SIGNAL_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const { id: onesignal_id, errors } = response.data;
        if (errors) {
          if (errors.includes('Notification has already been sent to all recipients')) {
            console.log('Notification already sent, sending a new one');

            const newNotificationResponse = await axios.post(
              'https://onesignal.com/api/v1/notifications',
              {
                app_id: process.env.ONE_SIGNAL_APP_ID,
                contents: {
                  en: `Your study session is scheduled to begin at ${time} on ${day}. Stay focused and make the most of your study time!`,
                },
                headings: { en: "Reminder: It's time to study!" },
                include_external_user_ids: [uid],
                send_after: isoDateTime,
              },
              {
                headers: {
                  Authorization: `${process.env.ONE_SIGNAL_API_KEY}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            const newOnesignalId = newNotificationResponse.data.id;
            const updateData = `UPDATE student_study_reminder SET onesignal_id = '${newOnesignalId}' WHERE uid = '${uid}' AND day = '${day}'`;
            await db(updateData);
          } else {
            console.log('Notification response errors:', errors);
            continue;
          }
        } else {
          const insertData = `INSERT INTO student_study_reminder(uid, day, time, onesignal_id) VALUES('${uid}', '${day}', '${time}', '${onesignal_id}')`;
          await db(insertData);
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError.response ? notificationError.response.data : notificationError.message);
        if (notificationError.response && notificationError.response.data.errors.includes('Notification has already been sent to all recipients')) {
          console.log('Handling recurring notification error');
          const newNotificationResponse = await axios.post(
            'https://onesignal.com/api/v1/notifications',
            {
              app_id: process.env.ONE_SIGNAL_APP_ID,
              contents: {
                en: `Your study session is scheduled to begin at ${time} on ${day}. Stay focused and make the most of your study time!`,
              },
              headings: { en: "Reminder: It's time to study!" },
              include_external_user_ids: [uid],
              send_after: isoDateTime,
            },
            {
              headers: {
                Authorization: `${process.env.ONE_SIGNAL_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const newOnesignalId = newNotificationResponse.data.id;
          const updateData = `UPDATE student_study_reminder SET onesignal_id = '${newOnesignalId}' WHERE uid = '${uid}' AND day = '${day}'`;
          await db(updateData);
        } else {
          throw notificationError;
        }
      }
    }

    try {
      const now = new Date();
      const nextMonthDate = new Date(now.setDate(now.getDate() + 29)); 
    
      nextMonthDate.setHours(hours, minutes, 0);
    
      const isoNextMonthDateTime = nextMonthDate.toISOString();
    
      const response = await axios.post(
        'https://onesignal.com/api/v1/notifications',
        {
          app_id: process.env.ONE_SIGNAL_APP_ID,
          contents: {
            en: `Reminder: Your study schedule is reset! Make updates to your study times now.`,
          },
          headings: { en: "Monthly Reminder: Study Schedule Reset" },
          include_external_user_ids: [uid],
          send_after: isoNextMonthDateTime,
        },
        {
          headers: {
            Authorization: `${process.env.ONE_SIGNAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.delivered) {
        const deleteOldRemindersQuery = `DELETE FROM student_study_reminder WHERE uid = '${uid}' AND day = '${day}'`;
        await db(deleteOldRemindersQuery);
        console.log('Successfully deleted old reminders');
      }
    
    } catch (error) {
      console.error('Error scheduling the notification:', error.response ? error.response.data : error.message);
    }
    
    

    res.json(true);

  } catch (error) {
    console.error('Error sending or updating notification:', error.response ? error.response.data : error.message);
    // await InsertErrorLog(uid, 'AddReminder Error', error.message);
    res.json({ success: false, message: 'An error occurred while sending or updating the notification' });
  }
} 


module.exports = {
  getChatUserBySubject,
  AddReminder
};
