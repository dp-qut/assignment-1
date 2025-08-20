const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// Document upload
router.post('/upload', uploadDocument, documentController.uploadDocument);

// Get user's documents
router.get('/', documentController.getMyDocuments);

// Get document by ID
router.get('/:id', documentController.getDocumentById);

// Download document
router.get('/:id/download', documentController.downloadDocument);

// Delete document
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
