const express = require('express');
const { getChatUserBySubject, AddReminder } = require('../controllers/getUsersController');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`API called: ${req.method} ${req.url}`);
    next();
  });

router.post('/getUsers', getChatUserBySubject);
router.post('/addReminder', AddReminder);

module.exports = router;
