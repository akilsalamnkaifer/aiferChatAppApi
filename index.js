const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const { db, checkConnection } = require('./config/sqlDb')
const Message = require('./models/Message');
const Chat = require('./models/Chat');
let chatId = "";
let GroupchatId = "";
require('dotenv').config();
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const axios = require("axios");

checkConnection()

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const hostname = '0.0.0.0';
const port = process.env.PORT || 3005;




// Middleware to parse JSON bodies
app.use(express.json());

app.use(cors()); // Enable CORS for all routes

// Connect to the database
connectDB().catch(err => {
  console.error('Failed to connect to the database:', err);
  process.exit(1); // Exit the process if the connection fails
});


const sendNotification = async (targetId, message, username) => {
  try {
    const response = await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: process.env.ONE_SIGNAL_APP_ID,
        contents: { en: message },
        headings: { en: username },
        include_external_user_ids: [targetId],
      },
      {
        headers: {
          Authorization: process.env.ONE_SIGNAL_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

const sendGroupNotification = async (uid, course_id, courseName) => {
  const userId = uid;
  console.log("uid: ", uid);
  console.log("course_id: ", course_id);
  
  

  console.log("userId: ", userId);
  

    // Fetch UIDs from user_courses based on the subject
    const userCourses = await db('SELECT uid FROM user_courses WHERE course_id = ?', [course_id]);
  
    // Extract the UIDs from the result
    const uids = userCourses.map((row) => row.uid);
  
    console.log("uids: ", uids);
  
    // Filter out the userId from the list of UIDs
    const targetIds = uids.filter(uid => uid !== userId);

    console.log("targetIds",targetIds);
    

  try {
    const response = await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: process.env.ONE_SIGNAL_APP_ID,
        contents: { en: "New message received" },
        headings: { en: courseName },
        include_external_user_ids: targetIds,
      },
      {
        headers: {
          Authorization: process.env.ONE_SIGNAL_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Notification sent successfully");
    
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};




io.on("connection", (socket) => {
  socket.on("Sendmessage", async (msg) => {
    const { message, sourceId, targetId, username, isImage, isVoice, isPdf } =
      msg;
    const newMessage = new Message({
      message,
      sourceId,
      chatId,
      isImage,
      isVoice,
      isPdf,
    });
    await newMessage.save();
    // Emit the message to all connected clients in the chat
    io.to(chatId.toString()).emit("OneByOnemessage", newMessage);
    sendNotification(targetId, message, username);
  });

  socket.on("SendGroupmessage", async (msg) => {
    console.log("Calling Send Group Message");
    const { message, sourceId, username, isImage, isVoice, isPdf, course_id, courseName } = msg;
    console.log({ message, sourceId, GroupchatId, username, isImage, isVoice, isPdf });

    const newMessage = new Message({ message, sourceId, chatId : GroupchatId, username, isImage, isVoice, isPdf });
    await newMessage.save();
    console.log("Saved Group Message");

    // Emit the message to all connected clients in the chat
    io.to(GroupchatId.toString()).emit("Groupmessages", newMessage);
    sendGroupNotification(sourceId, course_id, courseName);
    console.log("Message emitted to chatId:", GroupchatId);
  });

  

  socket.on("joinChat", async ({ users }) => {
    console.log("Join Chat:", users);
    
    try {
      let chat = await Chat.findOne({
        users: { $all: users, $size: users.length },
      });
 
      if (chat) {
        const messages = await Message.find({ chatId: chat._id });

        messages.forEach((message) => {;
          socket.emit("OneByOnemessage", message);
        });
        socket.join(chat._id.toString()); 
        return (chatId = chat._id);
      } else {
        chat = new Chat({ users });
        await chat.save();
        socket.join(chat._id.toString()); 
        return (chatId = chat._id);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  });

  socket.on("joinGroup", async ({ users, subject }) => {
    console.log("Join Group:", users);
    console.log("Subject:", subject);
    
    try {
      let chat = await GroupChat.findOne({
        subject: subject,
        users: { $in: [subject] },
      });      
 
      if (chat) {
        const messages = await Message.find({ chatId: chat._id });

        messages.forEach((message) => {;
          socket.emit("Groupmessages", message);
        });
        socket.join(chat._id.toString()); 
        return (GroupchatId = chat._id);
      } else {
        chat = new GroupChat({ subject,users });
        await chat.save();
        socket.join(chat._id.toString()); 
        return (GroupchatId = chat._id);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  });
});



// Import and use routes
const getUsersRoutes = require('./routes/getUsersRouter');
const GroupChat = require('./models/GroupChat');
app.use('/', getUsersRoutes);


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = { app, server, io };
