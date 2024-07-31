const express = require('express');
const { createChatBox } = require("../controllers/chatController")

const router = express.Router();

router.post('/createChat', createChatBox);

module.exports = router;
