const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
require('dotenv').config();

const hostname = '0.0.0.0';
const port = process.env.PORT || 3005;

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Connect to the database
connectDB();

// Import and use routes
const mentorRoutes = require('./routes/mentorRouter');
const chatRoutes = require('./routes/chatRouter');
const messageRoutes = require('./routes/messageRouter');
app.use('/', mentorRoutes);
app.use('/', chatRoutes);
app.use('/', messageRoutes);

const server = http.createServer(app);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
