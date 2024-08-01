const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
// Import and use routes
const mentorRoutes = require('./routes/mentorRouter');
const chatRoutes = require('./routes/chatRouter');
const messageRoutes = require('./routes/messageRouter');
const Message = require('./models/Message');
const io = socketIo(server, {
  cors: {
    origin: "https://8a3c-103-114-252-77.ngrok-free.app", // Replace with your LMS frontend URL
    methods: ["GET", "POST"],
  },
});

const hostname = '0.0.0.0';
const port = process.env.PORT || 3005;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Connect to the database
connectDB();

// On the server-side
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat room: ${chatId}`);
  });

  socket.on('sendMessage', async (messageData) => {
    try {
      const { sender, content, chatId } = messageData;
      const newMessage = await Message.create({ sender, content, chat: chatId });
      
      // Emit the new message to all clients in the room
      io.to(chatId).emit('newMessage', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});



app.use('/', mentorRoutes);
app.use('/', chatRoutes);
app.use('/', messageRoutes);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = { app, server, io };
