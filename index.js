const http = require('http');
const mongoose = require('mongoose');
const express = require('express');
require('dotenv').config();

const hostname = '0.0.0.0';
const port = process.env.PORT || 3005;


const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Replace the following with your MongoDB connection string
const mongoDB = 'mongodb+srv://akilsalamnk:akiljithu@cluster0.fymjrfg.mongodb.net/AiferChatApp'; // Local MongoDB instance
// const mongoDB = 'your MongoDB Atlas connection string'; // MongoDB Atlas

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a schema
const Schema = mongoose.Schema;

const MentorSchema = new Schema({
  name: String,
  profile: String,
  number: String,
  subject: String
});

// Create a model
const Mentor = mongoose.model('mentors', MentorSchema);

// API endpoint to get mentor details by subject
app.post('/mentor', async (req, res) => {
    const subject = req.body.subject;
    if (!subject) {
      return res.status(400).send('Subject query parameter is required');
    }
  
    try {
      const mentors = await Mentor.find({ subject: subject });
      console.log("mentors", mentors);
      res.json({ success: true, data: mentors });
    } catch (err) {
      res.status(500).send(err.message);
    }
  });
  
  

const server = http.createServer(app);

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
