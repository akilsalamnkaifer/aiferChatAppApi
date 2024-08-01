const express = require('express');
const { allMessages, sendMessage } = require('../controllers/messageController');

const router = express.Router();

// Middleware to log API requests
router.use((req, res, next) => {
  console.log(`API called: ${req.method} ${req.url}`);
  next();
});

router.post('/allMessages', allMessages);
router.post('/sendMessage', sendMessage);

module.exports = router;
