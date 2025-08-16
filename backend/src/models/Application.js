const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visaType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisaType',
    required: [true, 'Visa type is required']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose of visit is required'],
    enum: [
      'tourism',
      'business',
      'study',
      'work',
      'medical',
      'family_visit',
      'transit',
      'conference',
      'other'
    ]
  },
  personalInfo: {
    passportNumber: {
      type: String,
      required: [true, 'Passport number is required'],
      trim: true,
      uppercase: true
    },
    passportIssueDate: {
      type: Date,
      required: [true, 'Passport issue date is required']
    },
    passportExpiryDate: {
      type: Date,
      required: [true, 'Passport expiry date is required'],
      validate: {
        validator: function(value) {
          return value > new Date();
        },
        message: 'Passport must be valid for at least 6 months'
      }
    },
    passportIssuingCountry: {
      type: String,
      required: [true, 'Passport issuing country is required']
    },
    nationality: {
      type: String,
      required: [true, 'Nationality is required']
    },
    placeOfBirth: {
      type: String,
      required: [true, 'Place of birth is required']
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'divorced', 'widowed'],
      required: [true, 'Marital status is required']
    },
    occupation: {
      type: String,
      required: [true, 'Occupation is required']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: false
    },
    employer: {
      name: String,
      address: String,
      phone: String
    }
  },
  travelInfo: {
    intendedDateOfArrival: {
      type: Date,
      required: [true, 'Intended arrival date is required'],
      validate: {
        validator: function(value) {
          // Allow dates from today onwards (start of today)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today;
        },
        message: 'Arrival date cannot be in the past'
      }
    },
    intendedDateOfDeparture: {
      type: Date,
      required: [true, 'Intended departure date is required']
    },
    durationOfStay: {
      type: Number,
      required: [true, 'Duration of stay is required'],
      min: [1, 'Duration must be at least 1 day']
    },
    destinationAddress: {
      street: String,
      city: {
        type: String,
        required: [true, 'Destination city is required']
      },
      state: String,
      country: {
        type: String,
        required: [true, 'Destination country is required']
      },
      zipCode: String
    },
    accommodationType: {
      type: String,
      enum: ['hotel', 'hostel', 'friend_family', 'rental', 'other'],
      required: [true, 'Accommodation type is required']
    },
    accommodationDetails: {
      name: String,
      address: String,
      phone: String,
      confirmationNumber: String
    },
    previousVisits: [{
      country: String,
      dateOfVisit: Date,
      duration: Number,
      purpose: String
    }]
  },
  financialInfo: {
    fundsAvailable: {
      type: Number,
      required: [true, 'Available funds information is required'],
      min: [0, 'Funds cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    sourceOfFunds: {
      type: String,
      enum: ['personal_savings', 'employment', 'business', 'family_support', 'scholarship', 'other'],
      required: [true, 'Source of funds is required']
    },
    sponsorInfo: {
      hasSponsorship: {
        type: Boolean,
        default: false
      },
      sponsorName: String,
      sponsorRelationship: String,
      sponsorAddress: String,
      sponsorPhone: String,
      sponsorEmail: String
    }
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required']
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required']
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required']
    },
    email: String,
    address: String
  },
  documents: [{
    type: {
      type: String,
      required: true,
      enum: [
        'passport_copy',
        'photo',
        'bank_statement',
        'employment_letter',
        'invitation_letter',
        'hotel_booking',
        'flight_itinerary',
        'travel_insurance',
        'medical_certificate',
        'police_clearance',
        'academic_transcript',
        'other'
      ]
    },
    filename: {
      type: String,
      required: true
    },
    originalName: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    verificationNotes: String
  }],
  status: {
    type: String,
    enum: [
      'draft',
      'submitted',
      'under_review',
      'additional_docs_required',
      'interview_scheduled',
      'approved',
      'rejected',
      'cancelled'
    ],
    default: 'draft'
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    notes: String,
    notifyUser: {
      type: Boolean,
      default: true
    }
  }],
  adminNotes: [{
    note: {
      type: String,
      required: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  interviewInfo: {
    isRequired: {
      type: Boolean,
      default: false
    },
    scheduledDate: Date,
    location: String,
    interviewer: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'no_show', 'rescheduled'],
      default: 'scheduled'
    },
    notes: String
  },
  fee: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paid: {
      type: Boolean,
      default: false
    },
    paymentDate: Date,
    paymentMethod: String,
    paymentReference: String
  },
  submittedAt: Date,
  processedAt: Date,
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  expectedProcessingDays: {
    type: Number,
    default: 10
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'express'],
    default: 'normal'
  },
  additionalInfo: {
    hasBeenRefused: {
      type: Boolean,
      default: false
    },
    refusalDetails: String,
    hasCriminalRecord: {
      type: Boolean,
      default: false
    },
    criminalRecordDetails: String,
    hasHealthIssues: {
      type: Boolean,
      default: false
    },
    healthIssueDetails: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days since submission
applicationSchema.virtual('daysSinceSubmission').get(function() {
  if (!this.submittedAt) return null;
  return Math.floor((new Date() - this.submittedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for expected completion date
applicationSchema.virtual('expectedCompletionDate').get(function() {
  if (!this.submittedAt) return null;
  const submissionDate = new Date(this.submittedAt);
  submissionDate.setDate(submissionDate.getDate() + this.expectedProcessingDays);
  return submissionDate;
});

// Virtual for document completion percentage
applicationSchema.virtual('documentCompletionPercentage').get(function() {
  if (!this.documents || this.documents.length === 0) return 0;
  const requiredDocs = ['passport_copy', 'photo', 'bank_statement'];
  const uploadedRequiredDocs = this.documents.filter(doc => 
    requiredDocs.includes(doc.type)
  ).length;
  return Math.round((uploadedRequiredDocs / requiredDocs.length) * 100);
});

// Indexes for performance
applicationSchema.index({ userId: 1 });
applicationSchema.index({ applicationNumber: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ visaType: 1 });
applicationSchema.index({ submittedAt: -1 });
applicationSchema.index({ 'personalInfo.nationality': 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ 'travelInfo.intendedDateOfArrival': 1 });

// Pre-save middleware to generate application number
applicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.applicationNumber = `EVISA${year}${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate duration of stay
applicationSchema.pre('save', function(next) {
  if (this.travelInfo.intendedDateOfArrival && this.travelInfo.intendedDateOfDeparture) {
    const arrival = new Date(this.travelInfo.intendedDateOfArrival);
    const departure = new Date(this.travelInfo.intendedDateOfDeparture);
    this.travelInfo.durationOfStay = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
  }
  next();
});

// Method to add status history
applicationSchema.methods.addStatusHistory = function(status, changedBy, notes = '', notifyUser = true) {
  this.statusHistory.push({
    status,
    changedBy,
    notes,
    notifyUser
  });
  this.status = status;
  
  // Update relevant dates
  const now = new Date();
  switch (status) {
    case 'submitted':
      this.submittedAt = now;
      break;
    case 'under_review':
      this.processedAt = now;
      break;
    case 'approved':
      this.approvedAt = now;
      break;
    case 'rejected':
      this.rejectedAt = now;
      break;
  }
};

// Method to add admin note
applicationSchema.methods.addAdminNote = function(note, addedBy, isInternal = false) {
  this.adminNotes.push({
    note,
    addedBy,
    isInternal
  });
};

// Method to check if application is editable
applicationSchema.methods.isEditable = function() {
  return ['draft', 'additional_docs_required'].includes(this.status);
};

// Method to check if application can be submitted
applicationSchema.methods.canBeSubmitted = function() {
  const requiredDocs = ['passport_copy', 'photo', 'bank_statement'];
  const hasRequiredDocs = requiredDocs.every(docType =>
    this.documents.some(doc => doc.type === docType)
  );
  
  return this.status === 'draft' && hasRequiredDocs;
};

// Static method to get applications by status
applicationSchema.statics.getByStatus = function(status, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ status })
    .populate('userId', 'email profile.firstName profile.lastName')
    .populate('visaType', 'name description')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get user applications
applicationSchema.statics.getUserApplications = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ userId })
    .populate('visaType', 'name description processingDays fee')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

module.exports = mongoose.model('Application', applicationSchema);
