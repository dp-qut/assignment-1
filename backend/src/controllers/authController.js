const crypto = require('crypto');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  console.log('=== REGISTRATION REQUEST DEBUG ===');
  console.log('Request Method:', req.method);
  console.log('Request Path:', req.path);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('=====================================');
  
  const { email, password, profile } = req.body;

  // Validate required fields
  if (!email || !password || !profile) {
    console.log('Missing required fields:', { 
      email: !!email, 
      password: !!password, 
      profile: !!profile 
    });
    return next(new AppError('Email, password, and profile are required', 400));
  }

  const { firstName, lastName, nationality, dateOfBirth, phone } = profile;
  
  if (!firstName || !lastName || !nationality || !dateOfBirth || !phone) {
    console.log('Missing profile fields:', { 
      firstName: !!firstName, 
      lastName: !!lastName, 
      nationality: !!nationality, 
      dateOfBirth: !!dateOfBirth, 
      phone: !!phone 
    });
    return next(new AppError('All profile fields are required', 400));
  }

  console.log('Extracted fields:', { 
    email, 
    password: password ? '[HIDDEN]' : undefined, 
    profile 
  });

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    console.log('User already exists with email:', email);
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  try {
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      profile: {
        phone: phone.trim(),
        nationality: nationality.trim(),
        dateOfBirth: new Date(dateOfBirth)
      }
    });

    console.log('User created successfully:', user._id);

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email (but don't fail registration if email fails)
    try {
      await emailService.sendEmailVerification(user.email, verificationToken, user.firstName);
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profile: user.profile,
          emailVerified: user.emailVerified
        }
      }
    });
  } catch (error) {
    console.error('User creation error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation Error: ${messages.join(', ')}`, 400));
    }
    
    if (error.code === 11000) {
      return next(new AppError('User with this email already exists', 400));
    }
    
    return next(new AppError('Registration failed. Please try again.', 500));
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if user exists and include password in the result
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account is temporarily locked due to multiple failed login attempts. Please try again later.', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Account has been deactivated. Please contact support.', 401));
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Increment login attempts
    await user.incLoginAttempts();
    return next(new AppError('Invalid email or password', 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = user.generateAuthToken();

  // Set cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res
    .status(200)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          profile: user.profile,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin
        },
        token
      }
    });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res
    .status(200)
    .cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    .json({
      success: true,
      message: 'Logout successful'
    });
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError('Verification token is required', 400));
  }

  // Find user by verification token
  const user = await User.findByVerificationToken(token);
  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  // Update user
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user.email, user.firstName);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't fail the verification if welcome email fails
  }

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified
      }
    }
  });
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.emailVerified) {
    return next(new AppError('Email is already verified', 400));
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendEmailVerification(user.email, verificationToken, user.firstName);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Failed to send verification email', 500));
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with this email address', 404));
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordReset(user.email, resetToken, user.firstName);
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Failed to send password reset email', 500));
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return next(new AppError('Token and password are required', 400));
  }

  // Find user by reset token
  const user = await User.findByPasswordResetToken(token);
  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Update password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  // Reset login attempts if any
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  
  await user.save();

  // Send password change confirmation email
  try {
    await emailService.sendPasswordChangeConfirmation(user.email, user.firstName);
  } catch (error) {
    console.error('Failed to send password change confirmation:', error);
    // Don't fail the reset if confirmation email fails
  }

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Send password change confirmation email
  try {
    await emailService.sendPasswordChangeConfirmation(user.email, user.firstName);
  } catch (error) {
    console.error('Failed to send password change confirmation:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: user.profile,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = [
    'firstName',
    'lastName',
    'profile.phone',
    'profile.address',
    'profile.passport',
    'preferences'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key) || key.startsWith('profile.') || key.startsWith('preferences.')) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        profile: user.profile,
        preferences: user.preferences
      }
    }
  });
});

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return next(new AppError('Password is incorrect', 400));
  }

  // Check if user has active applications
  const Application = require('../models/Application');
  const activeApplications = await Application.countDocuments({
    userId: user._id,
    status: { $in: ['submitted', 'under_review', 'interview_scheduled'] }
  });

  if (activeApplications > 0) {
    return next(new AppError('Cannot delete account with active applications. Please wait for applications to be processed or cancel them.', 400));
  }

  // Deactivate instead of delete to maintain data integrity
  user.isActive = false;
  user.email = `deleted_${Date.now()}_${user.email}`;
  await user.save({ validateBeforeSave: false });

  // Send account deletion confirmation
  try {
    await emailService.sendAccountDeletionConfirmation(req.user.email, user.firstName);
  } catch (error) {
    console.error('Failed to send account deletion confirmation:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});

// @desc    Check token validity
// @route   GET /api/auth/check-token
// @access  Private
const checkToken = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  deleteAccount,
  checkToken
};
