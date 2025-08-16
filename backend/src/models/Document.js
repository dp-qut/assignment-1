const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'File name is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required']
  },
  mimetype: {
    type: String,
    required: [true, 'File type is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  url: {
    type: String,
    required: [true, 'File URL is required']
  },
  type: {
    type: String,
    enum: [
      'passport',
      'photo',
      'passport_copy',
      'birth_certificate',
      'marriage_certificate',
      'employment_letter',
      'bank_statement',
      'travel_itinerary',
      'flight_itinerary',
      'hotel_booking',
      'invitation_letter',
      'insurance',
      'travel_insurance',
      'medical_certificate',
      'police_clearance',
      'academic_transcript',
      'other'
    ],
    default: 'other'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNotes: {
    type: String
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number, // For videos
    pages: Number     // For PDFs
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ application: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for file size in MB
documentSchema.virtual('sizeInMB').get(function() {
  return (this.size / (1024 * 1024)).toFixed(2);
});

// Virtual for file extension
documentSchema.virtual('extension').get(function() {
  return this.filename.split('.').pop().toLowerCase();
});

// Pre-save middleware
documentSchema.pre('save', function(next) {
  // Set originalName if not provided
  if (!this.originalName) {
    this.originalName = this.filename;
  }
  
  next();
});

// Instance methods
documentSchema.methods.verify = function(verifiedBy, notes = '') {
  this.status = 'verified';
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  return this.save();
};

documentSchema.methods.reject = function(verifiedBy, notes = '') {
  this.status = 'rejected';
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  return this.save();
};

documentSchema.methods.isImage = function() {
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  return imageTypes.includes(this.extension);
};

documentSchema.methods.isPDF = function() {
  return this.extension === 'pdf';
};

documentSchema.methods.isDocument = function() {
  const docTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
  return docTypes.includes(this.extension);
};

// Static methods
documentSchema.statics.getByUser = function(userId, type = null) {
  const query = { user: userId };
  if (type) {
    query.type = type;
  }
  return this.find(query).sort({ createdAt: -1 });
};

documentSchema.statics.getByApplication = function(applicationId, type = null) {
  const query = { application: applicationId };
  if (type) {
    query.type = type;
  }
  return this.find(query).sort({ createdAt: -1 });
};

documentSchema.statics.getPendingVerification = function() {
  return this.find({ status: 'pending' })
    .populate('user', 'name email')
    .populate('application')
    .sort({ createdAt: 1 });
};

documentSchema.statics.cleanupExpired = function() {
  const now = new Date();
  return this.deleteMany({
    expiresAt: { $lte: now }
  });
};

// Middleware to cleanup file when document is removed
documentSchema.pre('deleteOne', { document: true, query: false }, async function() {
  try {
    const fileUploadService = require('../services/fileUploadService');
    await fileUploadService.deleteFromS3(this.url);
  } catch (error) {
    console.error('Error deleting file during document cleanup:', error);
  }
});

documentSchema.pre('deleteMany', async function() {
  try {
    const docs = await this.model.find(this.getQuery());
    const fileUploadService = require('../services/fileUploadService');
    
    for (const doc of docs) {
      try {
        await fileUploadService.deleteFromS3(doc.url);
      } catch (error) {
        console.error(`Error deleting file ${doc.url}:`, error);
      }
    }
  } catch (error) {
    console.error('Error during bulk document cleanup:', error);
  }
});

module.exports = mongoose.model('Document', documentSchema);
