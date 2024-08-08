const express = require('express');
const { getChatUserBySubject } = require('../controllers/getUsersController');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`API called: ${req.method} ${req.url}`);
    next();
  });

router.post('/getUsers', getChatUserBySubject);

module.exports = router;
