const express = require('express');
const { getChatUserBySubject } = require('../controllers/mentorContoller');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`API called: ${req.method} ${req.url}`);
    next();
  });

router.post('/chatUser', getChatUserBySubject);

module.exports = router;
