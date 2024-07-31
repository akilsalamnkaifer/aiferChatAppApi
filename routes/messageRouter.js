const express = require('express');
const { allMessages, sendMessage } = require('../controllers/messageController');

const router = express.Router();

router.post('/allMessages', allMessages);
router.post('/sendMessage', sendMessage);

module.exports = router;
