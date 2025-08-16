const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: [
      'application_submitted',
      'application_received',
      'under_review',
      'additional_docs_required',
      'interview_scheduled',
      'interview_reminder',
      'application_approved',
      'application_rejected',
      'document_verified',
      'document_rejected',
      'payment_received',
      'payment_failed',
      'system_maintenance',
      'account_locked',
      'password_reset',
      'email_verified',
      'general_announcement',
      'reminder',
      'other'
    ]
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  deliveryInfo: {
    email: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      failed: {
        type: Boolean,
        default: false
      },
      failureReason: String,
      messageId: String
    },
    sms: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      failed: {
        type: Boolean,
        default: false
      },
      failureReason: String,
      messageId: String
    },
    push: {
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: Date,
      failed: {
        type: Boolean,
        default: false
      },
      failureReason: String,
      messageId: String
    }
  },
  metadata: {
    actionUrl: String,
    actionText: String,
    expiresAt: Date,
    templateId: String,
    templateData: mongoose.Schema.Types.Mixed,
    category: String,
    tags: [String]
  },
  readAt: Date,
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledFor: Date,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  lastRetryAt: Date,
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return this.createdAt.toLocaleDateString();
});

// Virtual for delivery status summary
notificationSchema.virtual('deliveryStatus').get(function() {
  const channels = [];
  
  if (this.channels.email) {
    if (this.deliveryInfo.email.delivered) channels.push('email-delivered');
    else if (this.deliveryInfo.email.sent) channels.push('email-sent');
    else if (this.deliveryInfo.email.failed) channels.push('email-failed');
  }
  
  if (this.channels.sms) {
    if (this.deliveryInfo.sms.delivered) channels.push('sms-delivered');
    else if (this.deliveryInfo.sms.sent) channels.push('sms-sent');
    else if (this.deliveryInfo.sms.failed) channels.push('sms-failed');
  }
  
  if (this.channels.push) {
    if (this.deliveryInfo.push.delivered) channels.push('push-delivered');
    else if (this.deliveryInfo.push.sent) channels.push('push-sent');
    else if (this.deliveryInfo.push.failed) channels.push('push-failed');
  }
  
  return channels;
});

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.metadata.expiresAt && new Date() > this.metadata.expiresAt;
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ applicationId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ 'metadata.expiresAt': 1 });
notificationSchema.index({ archived: 1 });
notificationSchema.index({ createdAt: -1 });

// Pre-save middleware to set read status
notificationSchema.pre('save', function(next) {
  if (this.readAt && !this.isRead) {
    this.isRead = true;
  }
  
  if (this.archived && !this.archivedAt) {
    this.archivedAt = new Date();
  }
  
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function(readBy = null) {
  this.isRead = true;
  this.readAt = new Date();
  if (readBy) {
    this.readBy = readBy;
  }
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = null;
  this.readBy = null;
  return this.save();
};

// Method to archive notification
notificationSchema.methods.archive = function() {
  this.archived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Method to unarchive notification
notificationSchema.methods.unarchive = function() {
  this.archived = false;
  this.archivedAt = null;
  return this.save();
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(channel, status, info = {}) {
  if (!this.deliveryInfo[channel]) {
    this.deliveryInfo[channel] = {};
  }
  
  const now = new Date();
  
  switch (status) {
    case 'sent':
      this.deliveryInfo[channel].sent = true;
      this.deliveryInfo[channel].sentAt = now;
      if (info.messageId) {
        this.deliveryInfo[channel].messageId = info.messageId;
      }
      break;
    case 'delivered':
      this.deliveryInfo[channel].delivered = true;
      this.deliveryInfo[channel].deliveredAt = now;
      break;
    case 'failed':
      this.deliveryInfo[channel].failed = true;
      if (info.reason) {
        this.deliveryInfo[channel].failureReason = info.reason;
      }
      break;
  }
  
  // Update overall status
  if (this.isDeliveredAllChannels()) {
    this.status = 'delivered';
  } else if (this.isSentAllChannels()) {
    this.status = 'sent';
  } else if (this.isFailedAllChannels()) {
    this.status = 'failed';
  }
  
  return this.save();
};

// Method to check if delivered to all enabled channels
notificationSchema.methods.isDeliveredAllChannels = function() {
  const enabledChannels = Object.keys(this.channels).filter(channel => this.channels[channel]);
  return enabledChannels.every(channel => 
    this.deliveryInfo[channel] && this.deliveryInfo[channel].delivered
  );
};

// Method to check if sent to all enabled channels
notificationSchema.methods.isSentAllChannels = function() {
  const enabledChannels = Object.keys(this.channels).filter(channel => this.channels[channel]);
  return enabledChannels.every(channel => 
    this.deliveryInfo[channel] && this.deliveryInfo[channel].sent
  );
};

// Method to check if failed on all enabled channels
notificationSchema.methods.isFailedAllChannels = function() {
  const enabledChannels = Object.keys(this.channels).filter(channel => this.channels[channel]);
  return enabledChannels.every(channel => 
    this.deliveryInfo[channel] && this.deliveryInfo[channel].failed
  );
};

// Method to retry failed delivery
notificationSchema.methods.retryDelivery = function() {
  if (this.retryCount >= this.maxRetries) {
    return Promise.reject(new Error('Maximum retry attempts reached'));
  }
  
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  this.status = 'pending';
  
  // Reset failed flags for retry
  Object.keys(this.channels).forEach(channel => {
    if (this.channels[channel] && this.deliveryInfo[channel] && this.deliveryInfo[channel].failed) {
      this.deliveryInfo[channel].failed = false;
      this.deliveryInfo[channel].failureReason = null;
    }
  });
  
  return this.save();
};

// Static method to get user notifications with pagination
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null,
    priority = null,
    includeArchived = false
  } = options;
  
  const skip = (page - 1) * limit;
  const query = { userId };
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (priority) {
    query.priority = priority;
  }
  
  if (!includeArchived) {
    query.archived = { $ne: true };
  }
  
  return this.find(query)
    .populate('applicationId', 'applicationNumber status')
    .populate('createdBy', 'profile.firstName profile.lastName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    userId,
    isRead: false,
    archived: { $ne: true }
  });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = function(userId, readBy = null) {
  const update = {
    isRead: true,
    readAt: new Date()
  };
  
  if (readBy) {
    update.readBy = readBy;
  }
  
  return this.updateMany(
    { userId, isRead: false },
    update
  );
};

// Static method to get notifications for delivery
notificationSchema.statics.getPendingDeliveries = function() {
  return this.find({
    status: 'pending',
    $or: [
      { scheduledFor: { $lte: new Date() } },
      { scheduledFor: null }
    ],
    retryCount: { $lt: this.maxRetries || 3 }
  }).populate('userId', 'email profile preferences');
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    'metadata.expiresAt': { $lt: new Date() },
    archived: true
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
