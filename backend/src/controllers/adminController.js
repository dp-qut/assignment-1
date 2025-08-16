const User = require('../models/User');
const Application = require('../models/Application');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');

// Get dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalApplications = await Application.countDocuments();
    
    // Updated status mappings to match frontend expectations
    const pendingApplications = await Application.countDocuments({ 
      status: { $in: ['pending', 'submitted', 'underReview'] } 
    });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });
    
    // Count today's applications
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayApplications = await Application.countDocuments({
      createdAt: { $gte: today }
    });

    const recentApplications = await Application.find()
      .populate('userId', 'firstName lastName email')
      .populate('visaType', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalApplications,
          pendingApplications,
          approvedApplications,
          rejectedApplications,
          todayApplications
        },
        recentApplications
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query filters
    let filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add application count for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const applicationCount = await Application.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          applicationCount
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users: usersWithCounts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user status
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Also delete user's applications
    await Application.deleteMany({ user: req.params.id });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all applications
const getAllApplications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const dateRange = req.query.dateRange;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    // Add date range filter
    if (dateRange && dateRange !== 'all') {
      const days = parseInt(dateRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      filter.createdAt = { $gte: startDate };
    }

    const applications = await Application.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('visaType', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(filter);

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update application status
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        reviewNotes,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email').populate('visaType', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// Review application
const reviewApplication = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;
    
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        reviewNotes,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email').populate('visaType', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application reviewed successfully',
      data: { application }
    });
  } catch (error) {
    next(error);
  }
};

// Get system settings
const getSettings = async (req, res, next) => {
  try {
    // This would typically come from a Settings model
    const settings = {
      applicationFee: 100,
      processingTime: '5-10 business days',
      maxFileSize: '5MB',
      allowedFileTypes: ['pdf', 'jpg', 'png'],
      emailNotifications: true,
      smsNotifications: false
    };

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

// Update system settings
const updateSettings = async (req, res, next) => {
  try {
    // This would typically update a Settings model
    const settings = req.body;

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

// Export applications to Excel
const exportApplications = async (req, res, next) => {
  try {
    // Build filter from query parameters
    let filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.dateRange && req.query.dateRange !== 'all') {
      const days = parseInt(req.query.dateRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      filter.createdAt = { $gte: startDate };
    }

    // Get all applications with filter
    const applications = await Application.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('visaType', 'name')
      .sort({ createdAt: -1 });

    // Prepare data for Excel
    const excelData = applications.map(app => ({
      'Application Number': app.applicationNumber,
      'Applicant Name': `${app.userId?.firstName || ''} ${app.userId?.lastName || ''}`.trim(),
      'Email': app.userId?.email || '',
      'Visa Type': app.visaType?.name || '',
      'Status': app.status,
      'Purpose': app.travelInfo?.purpose || '',
      'Passport Number': app.personalInfo?.passportNumber || '',
      'Nationality': app.personalInfo?.nationality || '',
      'Submitted Date': app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '',
      'Reviewed Date': app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : '',
      'Review Notes': app.reviewNotes || ''
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=applications-export-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Send the file
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Export users to Excel
const exportUsers = async (req, res, next) => {
  try {
    // Build filter from query parameters
    let filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Get all users with filter
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    // Add application count for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const applicationCount = await Application.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          applicationCount
        };
      })
    );

    // Prepare data for Excel
    const excelData = usersWithCounts.map(user => ({
      'User ID': user._id.toString(),
      'First Name': user.firstName || '',
      'Last Name': user.lastName || '',
      'Email': user.email,
      'Role': user.role,
      'Status': user.status || 'active',
      'Email Verified': user.emailVerified ? 'Yes' : 'No',
      'Phone': user.profile?.phone || '',
      'Nationality': user.profile?.nationality || '',
      'Applications Count': user.applicationCount,
      'Joined Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=users-export-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Send the file
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllApplications,
  updateApplicationStatus,
  reviewApplication,
  getSettings,
  updateSettings,
  exportApplications,
  exportUsers
};
