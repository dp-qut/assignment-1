const Document = require('../models/Document');
const fileUploadService = require('../services/fileUploadService');

// Upload document
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Upload to S3 (or local storage)
    const fileUrl = await fileUploadService.uploadToS3(req.file);

    const document = new Document({
      filename: req.file.filename || req.file.originalname, // Generated filename
      originalName: req.file.originalname, // Original uploaded filename
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      user: req.user.id,
      type: req.body.documentType || req.body.type || 'other',
      application: req.body.applicationId || null
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's documents
const getMyDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        documents
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get document by ID
const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        document
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete document
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Delete from S3 (or local storage)
    await fileUploadService.deleteFromS3(document.url);

    await document.deleteOne();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  deleteDocument
};
