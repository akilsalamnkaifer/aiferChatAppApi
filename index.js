const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const Message = require('./models/Message');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://f1a5-150-129-103-189.ngrok-free.app"
      ];
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
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

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send existing messages to the client
  socket.on('joinChat', () => {
    Message.find().sort({ timestamps: 1 }) // 1 for ascending order, -1 for descending order
    .then(messages => {
      messages.forEach(message => {
        socket.emit('message', message);
      });
    })
    .catch(err => console.error('Error fetching messages:', err));
  
  });

  // Receive and save new messages
  socket.on('message', (messageData) => {
    const { sender, content, chatId } = messageData;
    const newMessage = new Message({ sender, content, chatId });
    newMessage.save()
      .then(savedMessage => {
        io.emit('message', savedMessage);
      })
      .catch(err => console.error('Error saving message:', err));
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Import and use routes
const mentorRoutes = require('./routes/mentorRouter');
const chatRoutes = require('./routes/chatRouter');
const messageRoutes = require('./routes/messageRouter');

app.use('/', mentorRoutes);
app.use('/', chatRoutes);
app.use('/', messageRoutes);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = { app, server, io };
