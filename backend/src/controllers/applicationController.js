const Application = require('../models/Application');
const { validationResult } = require('express-validator');
const PDFDocument = require('pdfkit');

// Create new application
const createApplication = async (req, res, next) => {
  try {
    // Import Document model for lookup
    const Document = require('../models/Document');
    
    // Generate application number
    const applicationNumber = `EVA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Prepare application data
    const applicationData = {
      ...req.body,
      userId: req.user.id,
      applicationNumber: applicationNumber
    };

    // Handle previousVisits data structure
    if (applicationData.travelInfo && typeof applicationData.travelInfo.previousVisits === 'string') {
      applicationData.travelInfo.previousVisits = [];
    }

    // Handle documents - convert Document ObjectIds to embedded document structure
    if (applicationData.documents) {
      if (typeof applicationData.documents === 'string') {
        applicationData.documents = [applicationData.documents];
      }
      
      // Get document details from Document collection
      const documentIds = applicationData.documents.filter(id => {
        if (typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/)) {
          return true;
        }
        return false;
      });

      if (documentIds.length > 0) {
        const docs = await Document.find({ _id: { $in: documentIds } });
        applicationData.documents = docs.map(doc => ({
          type: doc.type,
          filename: doc.filename,
          originalName: doc.originalName,
          path: doc.url,
          size: doc.size,
          mimeType: doc.mimetype,
          uploadDate: doc.createdAt,
          verified: doc.status === 'verified'
        }));
      } else {
        applicationData.documents = [];
      }
    } else {
      applicationData.documents = [];
    }

    console.log('Creating application with data:', JSON.stringify(applicationData, null, 2));

    const application = new Application(applicationData);

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Application creation error:', error);
    next(error);
  }
};

// Get user's applications
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user.id })
      .populate('visaType')
      .populate('userId', 'email profile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        applications
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get application by ID
const getApplicationById = async (req, res, next) => {
  try {
    // Application access already checked by middleware
    // Application is available in req.application
    const application = await Application.findById(req.application._id)
      .populate('visaType')
      .populate('userId', 'email profile');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update application
const updateApplication = async (req, res, next) => {
  try {
    // Application access and status already checked by middleware
    // Application is available in req.application
    const application = await Application.findByIdAndUpdate(
      req.application._id,
      req.body,
      { new: true, runValidators: true }
    ).populate('visaType');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete application
const deleteApplication = async (req, res, next) => {
  try {
    // Application access and status already checked by middleware
    // Application is available in req.application
    const application = await Application.findByIdAndDelete(req.application._id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Submit application
const submitApplication = async (req, res, next) => {
  try {
    // Application access and status already checked by middleware
    // Application is available in req.application
    const application = await Application.findByIdAndUpdate(
      req.application._id,
      { status: 'submitted', submittedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('visaType');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application
      }
    });
  } catch (error) {
    next(error);
  }
};

// Download application as PDF
const downloadApplication = async (req, res, next) => {
  try {
    console.log('🔽 Download request received for ID:', req.params.id);
    console.log('🔽 User ID:', req.user?.id);
    
    // Application access already checked by middleware
    // Application is available in req.application
    const application = await Application.findById(req.application._id)
      .populate('visaType')
      .populate('userId', 'email profile');

    console.log('🔽 Application found:', !!application);

    if (!application) {
      console.log('🔽 Application not found');
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    console.log('🔽 Generating PDF...');

    // Create PDF
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=application-${application.applicationNumber}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('E-Visa Application', { align: 'center' });
    doc.fontSize(16).text(`Application ID: ${application.applicationNumber}`, { align: 'center' });
    doc.moveDown();

    // Personal Information
    doc.fontSize(14).text('Personal Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${application.userId.firstName} ${application.userId.lastName}`);
    doc.text(`Email: ${application.userId.email}`);
    doc.text(`Phone: ${application.userId.profile?.phone || 'N/A'}`);
    doc.text(`Nationality: ${application.personalInfo?.nationality || 'N/A'}`);
    doc.text(`Date of Birth: ${application.userId.profile?.dateOfBirth ? new Date(application.userId.profile.dateOfBirth).toLocaleDateString() : 'N/A'}`);
    doc.text(`Marital Status: ${application.personalInfo?.maritalStatus || 'N/A'}`);
    doc.text(`Occupation: ${application.personalInfo?.occupation || 'N/A'}`);
    doc.moveDown();

    // Passport Information
    doc.fontSize(14).text('Passport Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Passport Number: ${application.personalInfo?.passportNumber || 'N/A'}`);
    doc.text(`Issuing Country: ${application.personalInfo?.passportIssuingCountry || 'N/A'}`);
    doc.text(`Issue Date: ${application.personalInfo?.passportIssueDate ? new Date(application.personalInfo.passportIssueDate).toLocaleDateString() : 'N/A'}`);
    doc.text(`Expiry Date: ${application.personalInfo?.passportExpiryDate ? new Date(application.personalInfo.passportExpiryDate).toLocaleDateString() : 'N/A'}`);
    doc.text(`Place of Birth: ${application.personalInfo?.placeOfBirth || 'N/A'}`);
    doc.moveDown();

    // Travel Information
    doc.fontSize(14).text('Travel Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Visa Type: ${application.visaType?.name || 'N/A'}`);
    doc.text(`Purpose: ${application.purpose || 'N/A'}`);
    doc.text(`Intended Arrival: ${application.travelInfo?.intendedDateOfArrival ? new Date(application.travelInfo.intendedDateOfArrival).toLocaleDateString() : 'N/A'}`);
    doc.text(`Intended Departure: ${application.travelInfo?.intendedDateOfDeparture ? new Date(application.travelInfo.intendedDateOfDeparture).toLocaleDateString() : 'N/A'}`);
    doc.text(`Duration: ${application.travelInfo?.durationOfStay || 'N/A'} days`);
    doc.text(`Accommodation: ${application.travelInfo?.accommodationType || 'N/A'}`);
    if (application.travelInfo?.destinationAddress) {
      doc.text(`Destination: ${application.travelInfo.destinationAddress.city}, ${application.travelInfo.destinationAddress.country}`);
    }
    doc.moveDown();

    // Financial Information
    if (application.financialInfo) {
      doc.fontSize(14).text('Financial Information', { underline: true });
      doc.fontSize(12);
      doc.text(`Available Funds: ${application.financialInfo.currency || 'USD'} ${application.financialInfo.fundsAvailable || 'N/A'}`);
      doc.text(`Source of Funds: ${application.financialInfo.sourceOfFunds || 'N/A'}`);
      doc.moveDown();
    }

    // Emergency Contact
    if (application.emergencyContact) {
      doc.fontSize(14).text('Emergency Contact', { underline: true });
      doc.fontSize(12);
      doc.text(`Name: ${application.emergencyContact.name || 'N/A'}`);
      doc.text(`Relationship: ${application.emergencyContact.relationship || 'N/A'}`);
      doc.text(`Phone: ${application.emergencyContact.phone || 'N/A'}`);
      doc.text(`Email: ${application.emergencyContact.email || 'N/A'}`);
      doc.moveDown();
    }

    // Application Status
    doc.fontSize(14).text('Application Status', { underline: true });
    doc.fontSize(12);
    doc.text(`Status: ${application.status}`);
    doc.text(`Submitted: ${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Not submitted'}`);
    doc.text(`Created: ${new Date(application.createdAt).toLocaleDateString()}`);
    doc.text(`Last Updated: ${new Date(application.updatedAt).toLocaleDateString()}`);

    // Documents
    if (application.documents && application.documents.length > 0) {
      doc.moveDown();
      doc.fontSize(14).text('Uploaded Documents', { underline: true });
      doc.fontSize(12);
      application.documents.forEach((document, index) => {
        doc.text(`${index + 1}. ${document.originalName || document.filename} (${document.type})`);
      });
    }

    // End PDF
    doc.end();

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  submitApplication,
  downloadApplication
};
