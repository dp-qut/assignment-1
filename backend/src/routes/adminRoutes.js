const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/dashboard/stats', adminController.getDashboardStats);

// Application management
router.get('/applications', adminController.getAllApplications);
router.get('/applications/export', adminController.exportApplications);
router.put('/applications/:id/status', adminController.updateApplicationStatus);
router.patch('/applications/:id/status', adminController.updateApplicationStatus);
router.put('/applications/:id/review', adminController.reviewApplication);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/export', adminController.exportUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// System configuration
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
