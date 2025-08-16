const express = require('express');
const router = express.Router();

// Import middleware
const { authorizeRoles, checkApplicationAccess, checkApplicationStatus } = require('../middleware/auth');

// Import controllers
const {
  createApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  submitApplication,
  downloadApplication
} = require('../controllers/applicationController');

// Debug route to test if routes are working
router.get('/debug', (req, res) => {
  console.log('🔍 Debug route hit - Application routes are working');
  res.json({ message: 'Application routes are working', user: req.user?.id });
});

// Application routes (authentication already applied in server.js)
// Only regular users can create, update, delete applications (not admins)
router.post('/', authorizeRoles('user'), createApplication);
router.get('/my', authorizeRoles('user'), getMyApplications);
router.get('/:id/download', authorizeRoles('user'), checkApplicationAccess, downloadApplication);
router.get('/:id', authorizeRoles('user'), checkApplicationAccess, getApplicationById);

// Routes that modify applications - prevent changes to approved/rejected applications
router.put('/:id', 
  authorizeRoles('user'), 
  checkApplicationAccess, 
  checkApplicationStatus(['draft', 'submitted', 'under_review', 'additional_docs_required']), 
  updateApplication
);

router.delete('/:id', 
  authorizeRoles('user'), 
  checkApplicationAccess, 
  checkApplicationStatus(['draft']), 
  deleteApplication
);

router.patch('/:id/submit', 
  authorizeRoles('user'), 
  checkApplicationAccess, 
  checkApplicationStatus(['draft']), 
  submitApplication
);

// Development only - Reset application to draft status for testing
router.patch('/:id/reset-to-draft', 
  authorizeRoles('user'), 
  checkApplicationAccess, 
  async (req, res, next) => {
    try {
      const Application = require('../models/Application');
      const application = await Application.findByIdAndUpdate(
        req.application._id,
        { 
          status: 'draft',
          submittedAt: null
        },
        { new: true, runValidators: true }
      ).populate('visaType');

      res.json({
        success: true,
        message: 'Application status reset to draft for testing',
        data: { application }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
