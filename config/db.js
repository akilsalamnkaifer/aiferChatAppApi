const mongoose = require('mongoose');
require('dotenv').config();

const mongoDB = process.env.MONGODB_URI || 'mongodb+srv://akilsalamnk:akiljithu@cluster0.fymjrfg.mongodb.net/AiferChatApp';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
