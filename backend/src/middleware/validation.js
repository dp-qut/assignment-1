const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Helper function to handle validation results
const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    const error = new AppError('Validation failed', 400);
    error.validationErrors = validationErrors;
    return next(error);
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('profile.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('profile.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('profile.phone')
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage('Please provide a valid phone number'),
  
  body('profile.nationality')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nationality is required'),
  
  body('profile.dateOfBirth')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const age = Math.floor((new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 16) {
        throw new Error('Must be at least 16 years old');
      }
      if (age > 120) {
        throw new Error('Please provide a valid date of birth');
      }
      return true;
    }),
  
  handleValidationResult
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationResult
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationResult
];

const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationResult
];

// Application validation rules
const validateApplicationCreation = [
  body('visaType')
    .isMongoId()
    .withMessage('Valid visa type is required'),
  
  body('purpose')
    .isIn(['tourism', 'business', 'study', 'work', 'medical', 'family_visit', 'transit', 'conference', 'other'])
    .withMessage('Invalid purpose of visit'),
  
  body('personalInfo.passportNumber')
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('Passport number must be between 6 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Passport number can only contain uppercase letters and numbers'),
  
  body('personalInfo.passportIssueDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid passport issue date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('Passport issue date cannot be in the future');
      }
      return true;
    }),
  
  body('personalInfo.passportExpiryDate')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid passport expiry date')
    .custom((value, { req }) => {
      const expiryDate = new Date(value);
      const issueDate = new Date(req.body.personalInfo.passportIssueDate);
      const currentDate = new Date();
      
      if (expiryDate <= currentDate) {
        throw new Error('Passport must be valid for at least 6 months');
      }
      
      if (expiryDate <= issueDate) {
        throw new Error('Passport expiry date must be after issue date');
      }
      
      // Check if passport is valid for at least 6 months from now
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      if (expiryDate < sixMonthsFromNow) {
        throw new Error('Passport must be valid for at least 6 months from the travel date');
      }
      
      return true;
    }),
  
  body('personalInfo.nationality')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nationality is required'),
  
  body('personalInfo.placeOfBirth')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Place of birth is required'),
  
  body('personalInfo.maritalStatus')
    .isIn(['single', 'married', 'divorced', 'widowed'])
    .withMessage('Invalid marital status'),
  
  body('personalInfo.occupation')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Occupation is required'),
  
  body('travelInfo.intendedDateOfArrival')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid arrival date')
    .custom((value) => {
      const arrivalDate = new Date(value);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (arrivalDate <= currentDate) {
        throw new Error('Arrival date must be in the future');
      }
      
      // Check if arrival date is not too far in the future (e.g., 2 years)
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
      
      if (arrivalDate > twoYearsFromNow) {
        throw new Error('Arrival date cannot be more than 2 years in the future');
      }
      
      return true;
    }),
  
  body('travelInfo.intendedDateOfDeparture')
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid departure date')
    .custom((value, { req }) => {
      const departureDate = new Date(value);
      const arrivalDate = new Date(req.body.travelInfo.intendedDateOfArrival);
      
      if (departureDate <= arrivalDate) {
        throw new Error('Departure date must be after arrival date');
      }
      
      // Calculate duration and check if it's reasonable
      const durationDays = Math.ceil((departureDate - arrivalDate) / (1000 * 60 * 60 * 24));
      
      if (durationDays > 365) {
        throw new Error('Stay duration cannot exceed 365 days');
      }
      
      return true;
    }),
  
  body('travelInfo.destinationAddress.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination city is required'),
  
  body('travelInfo.destinationAddress.country')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destination country is required'),
  
  body('travelInfo.accommodationType')
    .isIn(['hotel', 'hostel', 'friend_family', 'rental', 'other'])
    .withMessage('Invalid accommodation type'),
  
  body('financialInfo.fundsAvailable')
    .isFloat({ min: 0 })
    .withMessage('Available funds must be a positive number'),
  
  body('financialInfo.sourceOfFunds')
    .isIn(['personal_savings', 'employment', 'business', 'family_support', 'scholarship', 'other'])
    .withMessage('Invalid source of funds'),
  
  body('emergencyContact.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Emergency contact name is required'),
  
  body('emergencyContact.relationship')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact relationship is required'),
  
  body('emergencyContact.phone')
    .isMobilePhone()
    .withMessage('Valid emergency contact phone number is required'),
  
  handleValidationResult
];

const validateApplicationUpdate = [
  // Allow partial updates, so most fields are optional
  body('purpose')
    .optional()
    .isIn(['tourism', 'business', 'study', 'work', 'medical', 'family_visit', 'transit', 'conference', 'other'])
    .withMessage('Invalid purpose of visit'),
  
  body('personalInfo.passportNumber')
    .optional()
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('Passport number must be between 6 and 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Passport number can only contain uppercase letters and numbers'),
  
  body('travelInfo.intendedDateOfArrival')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Please provide a valid arrival date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Arrival date must be in the future');
      }
      return true;
    }),
  
  body('financialInfo.fundsAvailable')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Available funds must be a positive number'),
  
  handleValidationResult
];

// Document validation rules
const validateDocumentUpload = [
  body('type')
    .isIn([
      'passport_copy', 'photo', 'bank_statement', 'employment_letter',
      'invitation_letter', 'hotel_booking', 'flight_itinerary', 'travel_insurance',
      'medical_certificate', 'police_clearance', 'academic_transcript', 'other'
    ])
    .withMessage('Invalid document type'),
  
  handleValidationResult
];

// Admin validation rules
const validateStatusUpdate = [
  body('status')
    .isIn([
      'draft', 'submitted', 'under_review', 'additional_docs_required',
      'interview_scheduled', 'approved', 'rejected', 'cancelled'
    ])
    .withMessage('Invalid application status'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  body('notifyUser')
    .optional()
    .isBoolean()
    .withMessage('Notify user must be a boolean value'),
  
  handleValidationResult
];

const validateVisaTypeCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('code')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Code must be between 2 and 10 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Code can only contain uppercase letters, numbers, and underscores'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('category')
    .isIn(['tourist', 'business', 'student', 'work', 'family', 'medical', 'transit', 'diplomatic', 'other'])
    .withMessage('Invalid category'),
  
  body('duration.maxStayDays')
    .isInt({ min: 1, max: 365 })
    .withMessage('Maximum stay days must be between 1 and 365'),
  
  body('processing.standardDays')
    .isInt({ min: 1, max: 90 })
    .withMessage('Standard processing days must be between 1 and 90'),
  
  body('fees.standard.amount')
    .isFloat({ min: 0 })
    .withMessage('Fee amount must be a positive number'),
  
  handleValidationResult
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationResult
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO date')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  handleValidationResult
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  
  handleValidationResult
];

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded', 400));
  }
  
  // Check file size (5MB limit)
  if (req.file.size > 5 * 1024 * 1024) {
    return next(new AppError('File size cannot exceed 5MB', 400));
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new AppError('Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX files are allowed', 400));
  }
  
  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validatePasswordUpdate,
  validateApplicationCreation,
  validateApplicationUpdate,
  validateDocumentUpload,
  validateStatusUpdate,
  validateVisaTypeCreation,
  validatePagination,
  validateDateRange,
  validateObjectId,
  validateFileUpload,
  handleValidationResult
};
