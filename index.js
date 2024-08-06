const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const ChatUser = require('./models/ChatUser');
const Chat = require('./models/Chat')
let chatId = "";
require('dotenv').config();

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


const clients = {};

// connect to the Soket server
io.on("connection", (socket) => {
  console.log("Connected to Socket.io");
  
  socket.on("signin", (id) => {
    clients[id] = socket;
      console.log(clients);
  });

  // Sending messages to Each Other Orginal

  /// dup
  socket.on("message", (msg) => {
    console.log("Calling Send Message");
    const message = msg.message;
    const sourceId = msg.sourceId;
    const targetId = msg.targetId;
    if (clients[targetId]) {
      const newMessage = new MessageModel({ message, sourceId, chatId });
      newMessage.save();
      clients[targetId].emit("message", msg);
      console.log("Saved");
    }
  });

  socket.on("leaveChat", ({ sourceId }) => {
    console.log("Leave Chat:", sourceId);
    delete clients[sourceId];
  });

  // Dup
  socket.on("joinChat", async ({ users }) => {
    console.log(users);
    try {
      let chat = await Chat.findOne({
        users: { $all: users, $size: users.length },
      });
      MessageModel.find({ chatId: chat._id })
        .then((messages) => {
          console.log("Fetched messages:", messages);
          messages.forEach((message) => {
            socket.emit("message", message);
          });
        })
        .catch((err) => console.error("Error fetching messages:", err));
      if (!chat) {
        chat = new Chat({ users });
        await chat.save();
        console.log(`Chat_ID created with users: ${chat._id} ::: ${chatId}`);
        return (chatId = chat._id);
      } else {
        console.log(`Chat already exists with users: ${chat}`);
        return (chatId = chat._id);
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  });

  // fetch the mentor
  socket.on("getUsers", ({ subject }) => {
    console.log('calling');
    console.log("Received getUsers request with subject:", subject);

    if (!subject) {
      console.log("Subject query parameter is missing");
      socket.emit("error", "Subject query parameter is required");
      return;
    }

    ChatUser.find({ subject })   
      .then((users) => { 

        // Example structure of users and filtering
        const group = users.filter((user) => user.isGroup);
        const mentors = users.filter((user) => user.isMentor);
        const students = users.filter((user) => !user.isMentor && !user.isGroup);

        // Log the categorized users
        console.log("Group users:", group);
        console.log("Mentor users:", mentors);
        console.log("Student users:", students);

        socket.emit("users", { group, mentors, students });
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        socket.emit("error", "Error fetching users");
      });
  });
});

// Import and use routes
const mentorRoutes = require('./routes/mentorRouter');
// const chatRoutes = require('./routes/chatRouter');
// const messageRoutes = require('./routes/messageRouter');

app.use('/', mentorRoutes);
// app.use('/', chatRoutes);
// app.use('/', messageRoutes);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = { app, server, io };
