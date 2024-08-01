const express = require('express');
const { getMentorBySubject } = require('../controllers/mentorContoller');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`API called: ${req.method} ${req.url}`);
    next();
  });

router.post('/mentor', getMentorBySubject);

module.exports = router;
