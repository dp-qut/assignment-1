const VisaType = require('../models/VisaType');
const { validationResult } = require('express-validator');

// Get all visa types
const getAllVisaTypes = async (req, res, next) => {
  try {
    const visaTypes = await VisaType.find({ 
      'settings.isActive': true,
      'settings.isPublic': true 
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: {
        visaTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get visa type by ID
const getVisaTypeById = async (req, res, next) => {
  try {
    const visaType = await VisaType.findById(req.params.id);

    if (!visaType) {
      return res.status(404).json({
        success: false,
        message: 'Visa type not found'
      });
    }

    res.json({
      success: true,
      data: {
        visaType
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create new visa type (Admin only)
const createVisaType = async (req, res, next) => {
  try {
    const visaType = new VisaType(req.body);
    await visaType.save();

    res.status(201).json({
      success: true,
      message: 'Visa type created successfully',
      data: {
        visaType
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update visa type (Admin only)
const updateVisaType = async (req, res, next) => {
  try {
    const visaType = await VisaType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!visaType) {
      return res.status(404).json({
        success: false,
        message: 'Visa type not found'
      });
    }

    res.json({
      success: true,
      message: 'Visa type updated successfully',
      data: {
        visaType
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete visa type (Admin only)
const deleteVisaType = async (req, res, next) => {
  try {
    const visaType = await VisaType.findByIdAndDelete(req.params.id);

    if (!visaType) {
      return res.status(404).json({
        success: false,
        message: 'Visa type not found'
      });
    }

    res.json({
      success: true,
      message: 'Visa type deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVisaTypes,
  getVisaTypeById,
  createVisaType,
  updateVisaType,
  deleteVisaType
};
