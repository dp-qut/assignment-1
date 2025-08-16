const express = require('express');
const router = express.Router();

// Import controllers
const { getProfile, updateProfile } = require('../controllers/userController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// User routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
