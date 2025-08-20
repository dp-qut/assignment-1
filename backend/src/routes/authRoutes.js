const express = require('express');
const router = express.Router();

// Import controllers
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  deleteAccount,
  checkToken
} = require('../controllers/authController');

// Import middleware
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordUpdate
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/logout', logout);
router.post('/forgot-password', validatePasswordReset, forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.use(authenticateToken); // All routes below this middleware require authentication

router.get('/me', getMe);
router.get('/check-token', checkToken);
router.put('/profile', updateProfile);
router.put('/change-password', validatePasswordUpdate, changePassword);
router.delete('/account', deleteAccount);

module.exports = router;
