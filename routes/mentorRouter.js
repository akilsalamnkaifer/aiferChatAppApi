const express = require('express');
const { getMentorBySubject } = require('../controllers/mentorContoller');

const router = express.Router();

router.post('/mentor', getMentorBySubject);

module.exports = router;
