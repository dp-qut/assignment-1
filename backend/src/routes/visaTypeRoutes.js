const express = require('express');
const router = express.Router();
const visaTypeController = require('../controllers/visaTypeController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', visaTypeController.getAllVisaTypes);
router.get('/:id', visaTypeController.getVisaTypeById);

// Protected routes - Admin only
router.use(protect);
router.use(authorize('admin'));

router.post('/', visaTypeController.createVisaType);
router.put('/:id', visaTypeController.updateVisaType);
router.delete('/:id', visaTypeController.deleteVisaType);

module.exports = router;
