const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const { db, checkConnection } = require('./config/sqlDb');
const Message = require('./models/Message');
const Chat = require('./models/Chat');
const GroupChat = require('./models/GroupChat');
require('dotenv').config();
const AWS = require('aws-sdk');
const axios = require("axios");

let chatId;
let GroupchatId = "";

checkConnection();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
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

const sendNotification = async (targetId, message, username, isImage, isVoice, isPdf) => {
  try {
    await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: process.env.ONE_SIGNAL_APP_ID,
        contents: { en: isVoice ? "New voice received" : isPdf ? "New pdf received" : isImage ? "New image received" : message },
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
  try {
    const userCourses = await db('SELECT uid FROM user_courses WHERE course_id = ?', [course_id]);
    const uids = userCourses.map((row) => row.uid);
    const targetIds = uids.filter(id => id !== uid);

    await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: process.env.ONE_SIGNAL_APP_ID,
        contents: { en: "You have a new message received" },
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
    console.error("Error sending group notification:", error);
  }
};

io.on("connection", (socket) => {
  socket.on("Sendmessage", async (msg) => {
    const { message, sourceId, targetId, username, isImage, isVoice, isPdf } = msg;
    const newMessage = new Message({ message, sourceId, chatId, isImage, isVoice, isPdf });
    await newMessage.save();

    io.to(chatId.toString()).emit("OneByOnemessage", newMessage);
    sendNotification(targetId, message, username, isImage, isVoice, isPdf);
  });

  socket.on("SendGroupmessage", async (msg) => {
    const { message, sourceId, username, isImage, isVoice, isPdf, course_id, courseName } = msg;

    const newMessage = new Message({ message, sourceId, chatId: GroupchatId, username, isImage, isVoice, isPdf });
    await newMessage.save();

    io.to(GroupchatId.toString()).emit("Groupmessages", newMessage);
    sendGroupNotification(sourceId, course_id, courseName);
  });

  socket.on("joinChat", async ({ users }) => {
    console.log("Joining chat with users:", users);
    
    try {
      let chat = await Chat.findOne({
        users: { $all: users, $size: users.length },
      });

      if (chat) {
        const messages = await Message.find({ chatId: chat._id });
        console.log("Messages:", messages);
        
        messages.forEach((message) => socket.emit("OneByOnemessage", message));
        console.log("Joined chat:", chat._id.toString());
        
        socket.join(chat._id.toString());
        chatId = chat._id;
      } else {
        chat = new Chat({ users });
        await chat.save();
        socket.join(chat._id.toString());
        chatId = chat._id;
      }
    } catch (error) {
      console.error("Error joining chat:", error);
    }
  });

  socket.on("joinGroup", async ({ users, subject }) => {
    try {
      let chat = await GroupChat.findOne({
        subject,
        users: { $in: [subject] },
      });

      if (chat) {
        const messages = await Message.find({ chatId: chat._id });
        messages.forEach((message) => socket.emit("Groupmessages", message));
        socket.join(chat._id.toString());
        GroupchatId = chat._id;
      } else {
        chat = new GroupChat({ subject, users });
        await chat.save();
        socket.join(chat._id.toString());
        GroupchatId = chat._id;
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  });
});

// Import and use routes
const getUsersRoutes = require('./routes/getUsersRouter');
app.use('/', getUsersRoutes);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = { app, server, io };
