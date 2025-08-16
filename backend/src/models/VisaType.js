const mongoose = require('mongoose');

const visaTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Visa type name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Visa type code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Code cannot exceed 10 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'tourist',
      'business',
      'student',
      'work',
      'family',
      'medical',
      'transit',
      'diplomatic',
      'other'
    ]
  },
  duration: {
    maxStayDays: {
      type: Number,
      required: [true, 'Maximum stay duration is required'],
      min: [1, 'Duration must be at least 1 day']
    },
    validityPeriod: {
      type: Number,
      required: [true, 'Validity period is required'],
      min: [1, 'Validity period must be at least 1 day']
    },
    entries: {
      type: String,
      enum: ['single', 'multiple'],
      default: 'single'
    }
  },
  eligibility: {
    allowedNationalities: [{
      type: String,
      trim: true
    }],
    excludedNationalities: [{
      type: String,
      trim: true
    }],
    minAge: {
      type: Number,
      min: 0,
      max: 100
    },
    maxAge: {
      type: Number,
      min: 0,
      max: 120
    },
    requirements: [{
      requirement: {
        type: String,
        required: true
      },
      description: String,
      isMandatory: {
        type: Boolean,
        default: true
      }
    }]
  },
  requiredDocuments: [{
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
        'birth_certificate',
        'marriage_certificate',
        'sponsorship_letter',
        'other'
      ]
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    isMandatory: {
      type: Boolean,
      default: true
    },
    formats: [{
      type: String,
      enum: ['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX']
    }],
    maxSizeMB: {
      type: Number,
      default: 5
    },
    specifications: {
      photoRequirements: {
        width: Number,
        height: Number,
        background: String,
        quality: String
      },
      documentRequirements: {
        language: String,
        notarization: Boolean,
        translation: Boolean,
        apostille: Boolean
      }
    }
  }],
  processing: {
    standardDays: {
      type: Number,
      required: [true, 'Standard processing days is required'],
      min: [1, 'Processing time must be at least 1 day']
    },
    urgentDays: {
      type: Number,
      min: [1, 'Urgent processing time must be at least 1 day']
    },
    expressDays: {
      type: Number,
      min: [1, 'Express processing time must be at least 1 day']
    },
    workingDaysOnly: {
      type: Boolean,
      default: true
    },
    excludedDates: [{
      date: Date,
      reason: String
    }]
  },
  fees: {
    standard: {
      amount: {
        type: Number,
        required: [true, 'Standard fee amount is required'],
        min: [0, 'Fee cannot be negative']
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    urgent: {
      amount: {
        type: Number,
        min: [0, 'Fee cannot be negative']
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    express: {
      amount: {
        type: Number,
        min: [0, 'Fee cannot be negative']
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    serviceFee: {
      type: Number,
      default: 0,
      min: [0, 'Service fee cannot be negative']
    },
    additionalFees: [{
      name: String,
      amount: Number,
      description: String,
      isOptional: Boolean
    }]
  },
  applicationForm: {
    sections: [{
      name: String,
      fields: [{
        name: String,
        type: String,
        required: Boolean,
        options: [String],
        validation: {
          minLength: Number,
          maxLength: Number,
          pattern: String,
          min: Number,
          max: Number
        }
      }]
    }]
  },
  interview: {
    required: {
      type: Boolean,
      default: false
    },
    conditions: [String],
    location: String,
    duration: Number, // in minutes
    availableSlots: [{
      dayOfWeek: {
        type: Number,
        min: 0,
        max: 6
      },
      startTime: String,
      endTime: String,
      maxAppointments: Number
    }]
  },
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    maxApplicationsPerDay: {
      type: Number,
      min: 1
    },
    autoApproval: {
      enabled: {
        type: Boolean,
        default: false
      },
      conditions: [String]
    },
    notifications: {
      sendConfirmation: {
        type: Boolean,
        default: true
      },
      sendReminders: {
        type: Boolean,
        default: true
      },
      reminderDays: {
        type: Number,
        default: 3
      }
    }
  },
  statistics: {
    totalApplications: {
      type: Number,
      default: 0
    },
    approvedApplications: {
      type: Number,
      default: 0
    },
    rejectedApplications: {
      type: Number,
      default: 0
    },
    averageProcessingDays: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for approval rate
visaTypeSchema.virtual('approvalRate').get(function() {
  if (!this.statistics || this.statistics.totalApplications === 0) return 0;
  return ((this.statistics.approvedApplications / this.statistics.totalApplications) * 100).toFixed(2);
});

// Virtual for rejection rate
visaTypeSchema.virtual('rejectionRate').get(function() {
  if (!this.statistics || this.statistics.totalApplications === 0) return 0;
  return ((this.statistics.rejectedApplications / this.statistics.totalApplications) * 100).toFixed(2);
});

// Virtual for mandatory documents count
visaTypeSchema.virtual('mandatoryDocumentsCount').get(function() {
  if (!this.requiredDocuments || !Array.isArray(this.requiredDocuments)) {
    return 0;
  }
  return this.requiredDocuments.filter(doc => doc && doc.isMandatory).length;
});

// Indexes for performance
visaTypeSchema.index({ name: 1 });
visaTypeSchema.index({ code: 1 });
visaTypeSchema.index({ category: 1 });
visaTypeSchema.index({ 'settings.isActive': 1 });
visaTypeSchema.index({ 'settings.isPublic': 1 });
visaTypeSchema.index({ createdAt: -1 });

// Pre-save middleware to update statistics
visaTypeSchema.pre('save', function(next) {
  if (this.isModified('statistics')) {
    this.statistics.lastUpdated = new Date();
  }
  next();
});

// Method to check if nationality is eligible
visaTypeSchema.methods.isNationalityEligible = function(nationality) {
  // If no restrictions, all nationalities are eligible
  if (this.eligibility.allowedNationalities.length === 0 && 
      this.eligibility.excludedNationalities.length === 0) {
    return true;
  }
  
  // Check if nationality is in excluded list
  if (this.eligibility.excludedNationalities.includes(nationality)) {
    return false;
  }
  
  // If there's an allowed list, check if nationality is in it
  if (this.eligibility.allowedNationalities.length > 0) {
    return this.eligibility.allowedNationalities.includes(nationality);
  }
  
  return true;
};

// Method to check age eligibility
visaTypeSchema.methods.isAgeEligible = function(age) {
  if (this.eligibility.minAge && age < this.eligibility.minAge) {
    return false;
  }
  if (this.eligibility.maxAge && age > this.eligibility.maxAge) {
    return false;
  }
  return true;
};

// Method to get processing fee based on type
visaTypeSchema.methods.getProcessingFee = function(processingType = 'standard') {
  switch (processingType) {
    case 'urgent':
      return this.fees.urgent || this.fees.standard;
    case 'express':
      return this.fees.express || this.fees.standard;
    default:
      return this.fees.standard;
  }
};

// Method to get processing days based on type
visaTypeSchema.methods.getProcessingDays = function(processingType = 'standard') {
  switch (processingType) {
    case 'urgent':
      return this.processing.urgentDays || this.processing.standardDays;
    case 'express':
      return this.processing.expressDays || this.processing.standardDays;
    default:
      return this.processing.standardDays;
  }
};

// Method to update statistics
visaTypeSchema.methods.updateStatistics = async function() {
  const Application = mongoose.model('Application');
  
  const stats = await Application.aggregate([
    { $match: { visaType: this._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        rejected: {
          $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
        },
        avgProcessingDays: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$submittedAt', null] }, { $ne: ['$processedAt', null] }] },
              {
                $divide: [
                  { $subtract: ['$processedAt', '$submittedAt'] },
                  1000 * 60 * 60 * 24
                ]
              },
              null
            ]
          }
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.statistics.totalApplications = stats[0].total;
    this.statistics.approvedApplications = stats[0].approved;
    this.statistics.rejectedApplications = stats[0].rejected;
    this.statistics.averageProcessingDays = Math.round(stats[0].avgProcessingDays || 0);
  }
  
  return this.save();
};

// Static method to get active visa types
visaTypeSchema.statics.getActive = function(category = null) {
  const query = { 'settings.isActive': true, 'settings.isPublic': true };
  if (category) {
    query.category = category;
  }
  return this.find(query).sort({ name: 1 });
};

// Static method to get visa types by nationality
visaTypeSchema.statics.getByNationality = function(nationality) {
  return this.find({
    'settings.isActive': true,
    'settings.isPublic': true,
    $or: [
      { 'eligibility.allowedNationalities': { $size: 0 } },
      { 'eligibility.allowedNationalities': nationality }
    ],
    'eligibility.excludedNationalities': { $ne: nationality }
  }).sort({ name: 1 });
};

module.exports = mongoose.model('VisaType', visaTypeSchema);
