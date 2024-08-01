const express = require('express');
const { createChatBox } = require("../controllers/chatController")

const router = express.Router();

router.use((req, res, next) => {
    console.log(`API called: ${req.method} ${req.url}`);
    next();
  });

router.post('/createChat', createChatBox);

module.exports = router;
