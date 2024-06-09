const express = require('express');
const { register, login, refresh } = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');
const router = express.Router();
const {generateUniqueCode ,validateUniqueCode } = require('../controllers/userTelegramController');
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refresh);
router.post('/generate-code', auth, generateUniqueCode);
router.get('/telegram-login', validateUniqueCode);



// Example of a protected route
router.get('/me', auth, (req, res) => {
  res.send('Welcome to your profile');
});

module.exports = router;
