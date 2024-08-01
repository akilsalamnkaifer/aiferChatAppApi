const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const Message = require('./models/Message'); // Assuming you have a Message model defined in Mongoose
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // No CORS configuration


const hostname = '0.0.0.0';
const port = process.env.PORT || 3005;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Connect to the database
connectDB();

io.on('connection', async (socket) => {
  try {
    const messages = await Message.find({ chat });
    messages.forEach((message) => {
      socket.emit('message', message);
    });
    console.log("mes",messages);
  } catch (err) {
    console.error(err);
  }

  socket.on('message', async (messageData) => {
    const { sender, content, chatId } = messageData;
    try {
      const newMessage = new Message({ sender, content, chatId });
      await newMessage.save();
      console.log("new",newMessage);
      // Broadcast message to all clients
      io.emit('message', newMessage);
    } catch (err) {
      console.error(err);
    }
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
