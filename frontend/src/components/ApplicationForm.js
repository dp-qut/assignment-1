import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  DatePicker,
  LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Send as SendIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { applicationService, visaTypeService } from '../services/api';
import IndividualDocumentUpload from './IndividualDocumentUpload';
import PaymentForm from './PaymentForm';

const steps = [
  'Personal Information',
  'Passport Details', 
  'Travel Information',
  'Documents',
  'Payment',
  'Review & Submit'
];

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
  'Australia', 'Japan', 'South Korea', 'China', 'India', 'Brazil',
  'Mexico', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway'
];

const occupations = [
  'Software Engineer', 'Business Analyst', 'Teacher', 'Doctor', 'Lawyer',
  'Student', 'Retired', 'Self-employed', 'Government Employee', 'Other'
];

const validationSchemas = [
  // Step 1: Personal Information
  Yup.object({
    firstName: Yup.string().min(2, 'Too short').max(50, 'Too long').required('Required'),
    lastName: Yup.string().min(2, 'Too short').max(50, 'Too long').required('Required'),
    email: Yup.string().email('Invalid email').required('Required'),
    phone: Yup.string().min(10, 'Invalid phone').required('Required'),
    dateOfBirth: Yup.date().max(new Date(), 'Cannot be in future').required('Required'),
    nationality: Yup.string().required('Required'),
    gender: Yup.string().oneOf(['male', 'female', 'other']).required('Required'),
    maritalStatus: Yup.string().oneOf(['single', 'married', 'divorced', 'widowed']).required('Required'),
    occupation: Yup.string().required('Required')
  }),
  
  // Step 2: Passport Details
  Yup.object({
    passportNumber: Yup.string().min(6, 'Too short').max(20, 'Too long').required('Required'),
    passportIssueDate: Yup.date().max(new Date(), 'Cannot be in future').required('Required'),
    passportExpiryDate: Yup.date().min(new Date(), 'Passport must be valid').required('Required'),
    placeOfBirth: Yup.string().required('Required'),
    issuingCountry: Yup.string().required('Required')
  }),
  
  // Step 3: Travel Information
  Yup.object({
    visaTypeId: Yup.string().required('Visa type is required'),
    priority: Yup.string().oneOf(['normal', 'urgent', 'express'], 'Invalid priority').required('Priority is required'),
    purposeOfVisit: Yup.string().required('Purpose of visit is required'),
    intendedArrivalDate: Yup.date()
      .min(new Date(new Date().setHours(0, 0, 0, 0)), 'Arrival date cannot be in the past')
      .required('Arrival date is required'),
    intendedDepartureDate: Yup.date()
      .min(Yup.ref('intendedArrivalDate'), 'Departure date must be after arrival date')
      .required('Departure date is required'),
    durationOfStay: Yup.number()
      .min(1, 'Duration must be at least 1 day')
      .max(365, 'Duration cannot exceed 365 days')
      .required('Duration of stay is required'),
    accommodationType: Yup.string().required('Accommodation type is required'),
    destinationCity: Yup.string().required('Destination city is required'),
    destinationCountry: Yup.string().required('Destination country is required'),
    fundsAvailable: Yup.number()
      .min(100, 'Minimum funds required: $100')
      .required('Available funds information is required'),
    sourceOfFunds: Yup.string().required('Source of funds is required'),
    emergencyContactName: Yup.string().required('Emergency contact name is required'),
    emergencyContactPhone: Yup.string().required('Emergency contact phone is required'),
    emergencyContactRelationship: Yup.string().required('Emergency contact relationship is required'),
    accommodation: Yup.string().min(10, 'Please provide more details').required('Accommodation details are required'),
    previousVisits: Yup.boolean()
  }),
  
  // Step 4: Documents (validated separately)
  Yup.object({}),
  
  // Step 5: Payment (validated separately)
  Yup.object({}),
  
  // Step 6: Review (no additional validation)
  Yup.object({})
];

const ApplicationForm = ({ application, onSave, onCancel }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [visaTypes, setVisaTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState([]);
  const [requiredDocuments, setRequiredDocuments] = useState([]);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const formik = useFormik({
    initialValues: {
      // Personal Information
      firstName: application?.personalInfo?.firstName || '',
      lastName: application?.personalInfo?.lastName || '',
      email: application?.personalInfo?.email || '',
      phone: application?.personalInfo?.phone || '',
      dateOfBirth: application?.personalInfo?.dateOfBirth ? new Date(application.personalInfo.dateOfBirth) : null,
      nationality: application?.personalInfo?.nationality || '',
      gender: application?.personalInfo?.gender || '',
      maritalStatus: application?.personalInfo?.maritalStatus || '',
      occupation: application?.personalInfo?.occupation || '',
      
      // Passport Details
      passportNumber: application?.passportInfo?.passportNumber || '',
      passportIssueDate: application?.passportInfo?.passportIssueDate ? new Date(application.passportInfo.passportIssueDate) : null,
      passportExpiryDate: application?.passportInfo?.passportExpiryDate ? new Date(application.passportInfo.passportExpiryDate) : null,
      placeOfBirth: application?.passportInfo?.placeOfBirth || '',
      issuingCountry: application?.passportInfo?.issuingCountry || '',
      
      // Travel Information
      visaTypeId: application?.visaType?._id || '',
      purposeOfVisit: application?.travelInfo?.purposeOfVisit || '',
      intendedArrivalDate: application?.travelInfo?.intendedArrivalDate ? new Date(application.travelInfo.intendedArrivalDate) : null,
      intendedDepartureDate: application?.travelInfo?.intendedDepartureDate ? new Date(application.travelInfo.intendedDepartureDate) : null,
      durationOfStay: application?.travelInfo?.durationOfStay || 30,
      accommodationType: application?.travelInfo?.accommodationType || 'hotel',
      destinationCity: application?.travelInfo?.destinationAddress?.city || '',
      destinationCountry: application?.travelInfo?.destinationAddress?.country || '',
      accommodation: application?.travelInfo?.accommodation || '',
      previousVisits: application?.travelInfo?.previousVisits?.length > 0 || false,
      previousVisitDetails: application?.travelInfo?.previousVisitDetails || '',
      
      // Financial Information
      fundsAvailable: application?.financialInfo?.fundsAvailable || 5000,
      sourceOfFunds: (() => {
        const legacyValue = application?.financialInfo?.sourceOfFunds || 'employment';
        // Map legacy values to new enum values
        const mapping = {
          'savings': 'personal_savings',
          'sponsor': 'family_support'
        };
        return mapping[legacyValue] || legacyValue;
      })(),
      
      // Emergency Contact
      emergencyContactName: application?.emergencyContact?.name || '',
      emergencyContactPhone: application?.emergencyContact?.phone || '',
      emergencyContactRelationship: application?.emergencyContact?.relationship || 'spouse'
    },
    validationSchema: validationSchemas[activeStep] || Yup.object({}),
    onSubmit: async (values) => {
      if (activeStep === steps.length - 1) {
        await handleSubmitApplication(values);
      } else {
        setActiveStep((prev) => prev + 1);
      }
    }
  });

  useEffect(() => {
    loadVisaTypes();
    if (application?.documents) {
      setDocuments(application.documents);
    }
  }, [application]);

  useEffect(() => {
    if (formik.values.visaTypeId && visaTypes.length > 0) {
      const selectedVisaType = visaTypes.find(vt => vt._id === formik.values.visaTypeId);
      if (selectedVisaType && selectedVisaType.requiredDocuments) {
        // Extract document types from the requiredDocuments array
        const docTypes = selectedVisaType.requiredDocuments.map(doc => doc.type || doc);
        setRequiredDocuments(docTypes);
      } else {
        setRequiredDocuments([]);
      }
    }
  }, [formik.values.visaTypeId, visaTypes]);

  const loadVisaTypes = async () => {
    try {
      setLoading(true);
      
      // Use the service call
      const response = await visaTypeService.getVisaTypes();
      
      if (response && response.data && response.data.data && response.data.data.visaTypes) {
        setVisaTypes(response.data.data.visaTypes);
      } else {
        console.error('Invalid response structure:', response);
        console.error('Expected response.data.data.visaTypes, got:', response?.data);
        setError('Invalid response from server');
      }
      
    } catch (err) {
      console.error('Load visa types error:', err);
      setError('Failed to load visa types: ' + err.message);
      
      // Set empty array as fallback
      setVisaTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      // Clear any previous errors
      setError('');
      
      // Validate the current step
      const currentStepErrors = await formik.validateForm();
      const currentStepFields = getCurrentStepFields();
      
      // Filter errors to only include current step fields
      const relevantErrors = Object.keys(currentStepErrors).filter(key => 
        currentStepFields.includes(key)
      );
      
      if (relevantErrors.length === 0) {
        if (activeStep === 3) { // Documents step
          if (!validateDocuments()) {
            return;
          }
        }
        
        if (activeStep === 4) { // Payment step
          if (!paymentCompleted) {
            setError('Please complete the payment before proceeding');
            return;
          }
        }
        
        if (activeStep < steps.length - 1) {
          setActiveStep((prev) => prev + 1);
        }
      } else {
        // Mark only relevant fields as touched
        const touchedFields = {};
        currentStepFields.forEach(field => {
          touchedFields[field] = true;
        });
        formik.setTouched(touchedFields);
        
        setError(`Please fill in all required fields correctly`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setError('An error occurred while validating the form');
    }
  };

  const getCurrentStepFields = () => {
    switch (activeStep) {
      case 0: // Personal Information
        return ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'nationality', 'gender', 'maritalStatus', 'occupation'];
      case 1: // Passport Details
        return ['passportNumber', 'passportIssueDate', 'passportExpiryDate', 'placeOfBirth', 'issuingCountry'];
      case 2: // Travel Information
        return [
          'visaTypeId', 'purposeOfVisit', 'intendedArrivalDate', 'intendedDepartureDate', 
          'durationOfStay', 'accommodationType', 'destinationCity', 'destinationCountry',
          'fundsAvailable', 'sourceOfFunds', 'emergencyContactName', 'emergencyContactPhone', 
          'emergencyContactRelationship', 'accommodation'
        ];
      case 3: // Documents
        return []; // No form validation, just document validation
      case 4: // Payment
        return []; // Payment validation handled separately
      case 5: // Review
        return [];
      default:
        return [];
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmitApplication = async (values) => {
    try {
      setLoading(true);
      const applicationData = buildApplicationData();
      // Don't set status here - let the submit API handle status change
      
      if (application?._id) {
        await applicationService.updateApplication(application._id, applicationData);
        await applicationService.submitApplication(application._id);
      } else {
        const response = await applicationService.createApplication(applicationData);
        await applicationService.submitApplication(response.data.data.application._id);
      }
      
      onSave();
    } catch (err) {
      setError('Failed to submit application');
      console.error('Submit application error:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildApplicationData = () => {
    // Map purpose of visit to valid enum values
    const purposeMapping = {
      'tourism': 'tourism',
      'business': 'business', 
      'study': 'study',
      'work': 'work',
      'medical': 'medical',
      'family visit': 'family_visit',
      'transit': 'transit',
      'conference': 'conference'
    };

    const purpose = formik.values.purposeOfVisit?.toLowerCase();
    const mappedPurpose = purposeMapping[purpose] || 'other';

    return {
      visaType: formik.values.visaTypeId,
      purpose: mappedPurpose,
      personalInfo: {
        firstName: formik.values.firstName,
        lastName: formik.values.lastName,
        email: formik.values.email,
        phone: formik.values.phone,
        dateOfBirth: formik.values.dateOfBirth,
        nationality: formik.values.nationality,
        gender: formik.values.gender,
        maritalStatus: formik.values.maritalStatus,
        occupation: formik.values.occupation,
        passportNumber: formik.values.passportNumber,
        passportIssueDate: formik.values.passportIssueDate,
        passportExpiryDate: formik.values.passportExpiryDate,
        placeOfBirth: formik.values.placeOfBirth,
        passportIssuingCountry: formik.values.issuingCountry || formik.values.nationality
      },
      travelInfo: {
        intendedDateOfArrival: formik.values.intendedArrivalDate,
        intendedDateOfDeparture: formik.values.intendedDepartureDate,
        durationOfStay: parseInt(formik.values.durationOfStay) || 30,
        accommodationType: formik.values.accommodationType || 'hotel',
        destinationAddress: {
          street: formik.values.destinationStreet || '',
          city: formik.values.destinationCity || 'Capital City',
          state: formik.values.destinationState || '',
          country: formik.values.destinationCountry || 'Destination Country',
          postalCode: formik.values.destinationPostalCode || ''
        },
        accommodationDetails: {
          name: formik.values.accommodation || 'Not specified',
          address: `${formik.values.destinationCity || ''}, ${formik.values.destinationCountry || ''}`,
          phone: '',
          confirmationNumber: ''
        },
        previousVisits: formik.values.previousVisits === true ? 
          (Array.isArray(formik.values.previousVisitDetails) ? formik.values.previousVisitDetails : []) : []
      },
      financialInfo: {
        fundsAvailable: parseFloat(formik.values.fundsAvailable) || 5000,
        currency: formik.values.currency || 'USD',
        sourceOfFunds: (() => {
          const value = formik.values.sourceOfFunds || 'employment';
          // Map legacy values to valid enum values
          const mapping = {
            'savings': 'personal_savings',
            'sponsor': 'family_support'
          };
          return mapping[value] || value;
        })()
      },
      emergencyContact: {
        name: formik.values.emergencyContactName || `${formik.values.firstName} ${formik.values.lastName}`,
        relationship: formik.values.emergencyContactRelationship || 'self',
        phone: formik.values.emergencyContactPhone || formik.values.phone,
        email: formik.values.emergencyContactEmail || formik.values.email
      },
      fee: {
        amount: paymentData?.amount || 0,
        currency: paymentData?.currency || 'USD',
        paid: paymentCompleted || false,
        paymentDate: paymentCompleted ? new Date() : null,
        paymentMethod: paymentData?.method || null,
        paymentReference: paymentData?.reference || null
      },
      documents: documents.map(doc => doc._id || doc.id).filter(Boolean)
    };
  };

  const validateDocuments = () => {
    if (!documents || !requiredDocuments) return true;
    
    const uploadedDocTypes = documents.map(doc => doc.type);
    const missingDocs = requiredDocuments.filter(reqDoc => !uploadedDocTypes.includes(reqDoc));
    
    if (missingDocs.length > 0) {
      setError(`Missing required documents: ${missingDocs.join(', ')}`);
      return false;
    }
    return true;
  };

  const handlePaymentSuccess = (payment) => {
    setPaymentData(payment);
    setPaymentCompleted(true);
    setError('');
    setActiveStep((prev) => prev + 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="firstName"
                label="First Name"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="lastName"
                label="Last Name"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="email"
                label="Email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="phone"
                label="Phone Number"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date of Birth"
                  value={formik.values.dateOfBirth}
                  onChange={(value) => formik.setFieldValue('dateOfBirth', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                      helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="nationality"
                label="Nationality"
                value={formik.values.nationality}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.nationality && Boolean(formik.errors.nationality)}
                helperText={formik.touched.nationality && formik.errors.nationality}
              >
                {countries && countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Gender</FormLabel>
                <RadioGroup
                  name="gender"
                  value={formik.values.gender}
                  onChange={formik.handleChange}
                  row
                >
                  <FormControlLabel value="male" control={<Radio />} label="Male" />
                  <FormControlLabel value="female" control={<Radio />} label="Female" />
                  <FormControlLabel value="other" control={<Radio />} label="Other" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="maritalStatus"
                label="Marital Status"
                value={formik.values.maritalStatus}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.maritalStatus && Boolean(formik.errors.maritalStatus)}
                helperText={formik.touched.maritalStatus && formik.errors.maritalStatus}
              >
                <MenuItem value="single">Single</MenuItem>
                <MenuItem value="married">Married</MenuItem>
                <MenuItem value="divorced">Divorced</MenuItem>
                <MenuItem value="widowed">Widowed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                name="occupation"
                label="Occupation"
                value={formik.values.occupation}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.occupation && Boolean(formik.errors.occupation)}
                helperText={formik.touched.occupation && formik.errors.occupation}
              >
                {occupations && occupations.map((occupation) => (
                  <MenuItem key={occupation} value={occupation}>
                    {occupation}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="passportNumber"
                label="Passport Number"
                value={formik.values.passportNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.passportNumber && Boolean(formik.errors.passportNumber)}
                helperText={formik.touched.passportNumber && formik.errors.passportNumber}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="issuingCountry"
                label="Issuing Country"
                value={formik.values.issuingCountry}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.issuingCountry && Boolean(formik.errors.issuingCountry)}
                helperText={formik.touched.issuingCountry && formik.errors.issuingCountry}
              >
                {countries && countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Passport Issue Date"
                  value={formik.values.passportIssueDate}
                  onChange={(value) => formik.setFieldValue('passportIssueDate', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.passportIssueDate && Boolean(formik.errors.passportIssueDate)}
                      helperText={formik.touched.passportIssueDate && formik.errors.passportIssueDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Passport Expiry Date"
                  value={formik.values.passportExpiryDate}
                  onChange={(value) => formik.setFieldValue('passportExpiryDate', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.passportExpiryDate && Boolean(formik.errors.passportExpiryDate)}
                      helperText={formik.touched.passportExpiryDate && formik.errors.passportExpiryDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="placeOfBirth"
                label="Place of Birth"
                value={formik.values.placeOfBirth}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.placeOfBirth && Boolean(formik.errors.placeOfBirth)}
                helperText={formik.touched.placeOfBirth && formik.errors.placeOfBirth}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                name="visaTypeId"
                label="Visa Type"
                value={formik.values.visaTypeId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.visaTypeId && Boolean(formik.errors.visaTypeId)}
                helperText={formik.touched.visaTypeId && formik.errors.visaTypeId}
              >
                {visaTypes && visaTypes.length > 0 ? (
                  visaTypes.map((visaType) => (
                    <MenuItem key={visaType._id} value={visaType._id}>
                      {visaType.name} - {visaType.description}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    {loading ? 'Loading visa types...' : 'No visa types available'}
                  </MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                name="purposeOfVisit"
                label="Purpose of Visit"
                value={formik.values.purposeOfVisit}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.purposeOfVisit && Boolean(formik.errors.purposeOfVisit)}
                helperText={formik.touched.purposeOfVisit && formik.errors.purposeOfVisit}
              >
                <MenuItem value="tourism">Tourism</MenuItem>
                <MenuItem value="business">Business</MenuItem>
                <MenuItem value="study">Study</MenuItem>
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="medical">Medical</MenuItem>
                <MenuItem value="family visit">Family Visit</MenuItem>
                <MenuItem value="transit">Transit</MenuItem>
                <MenuItem value="conference">Conference</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Intended Arrival Date"
                  value={formik.values.intendedArrivalDate}
                  onChange={(value) => formik.setFieldValue('intendedArrivalDate', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.intendedArrivalDate && Boolean(formik.errors.intendedArrivalDate)}
                      helperText={formik.touched.intendedArrivalDate && formik.errors.intendedArrivalDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Intended Departure Date"
                  value={formik.values.intendedDepartureDate}
                  onChange={(value) => formik.setFieldValue('intendedDepartureDate', value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.intendedDepartureDate && Boolean(formik.errors.intendedDepartureDate)}
                      helperText={formik.touched.intendedDepartureDate && formik.errors.intendedDepartureDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="durationOfStay"
                label="Duration of Stay (days)"
                type="number"
                value={formik.values.durationOfStay}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.durationOfStay && Boolean(formik.errors.durationOfStay)}
                helperText={formik.touched.durationOfStay && formik.errors.durationOfStay}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="accommodationType"
                label="Accommodation Type"
                value={formik.values.accommodationType}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.accommodationType && Boolean(formik.errors.accommodationType)}
                helperText={formik.touched.accommodationType && formik.errors.accommodationType}
              >
                <MenuItem value="hotel">Hotel</MenuItem>
                <MenuItem value="hostel">Hostel</MenuItem>
                <MenuItem value="friend_family">Friend/Family</MenuItem>
                <MenuItem value="rental">Rental Property</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="destinationCity"
                label="Destination City"
                value={formik.values.destinationCity}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.destinationCity && Boolean(formik.errors.destinationCity)}
                helperText={formik.touched.destinationCity && formik.errors.destinationCity}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="destinationCountry"
                label="Destination Country"
                value={formik.values.destinationCountry}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.destinationCountry && Boolean(formik.errors.destinationCountry)}
                helperText={formik.touched.destinationCountry && formik.errors.destinationCountry}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="fundsAvailable"
                label="Available Funds (USD)"
                type="number"
                value={formik.values.fundsAvailable}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fundsAvailable && Boolean(formik.errors.fundsAvailable)}
                helperText={formik.touched.fundsAvailable && formik.errors.fundsAvailable}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="sourceOfFunds"
                label="Source of Funds"
                value={formik.values.sourceOfFunds}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.sourceOfFunds && Boolean(formik.errors.sourceOfFunds)}
                helperText={formik.touched.sourceOfFunds && formik.errors.sourceOfFunds}
              >
                <MenuItem value="employment">Employment</MenuItem>
                <MenuItem value="personal_savings">Personal Savings</MenuItem>
                <MenuItem value="business">Business</MenuItem>
                <MenuItem value="family_support">Family Support/Sponsor</MenuItem>
                <MenuItem value="scholarship">Scholarship</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="emergencyContactName"
                label="Emergency Contact Name"
                value={formik.values.emergencyContactName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.emergencyContactName && Boolean(formik.errors.emergencyContactName)}
                helperText={formik.touched.emergencyContactName && formik.errors.emergencyContactName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="emergencyContactPhone"
                label="Emergency Contact Phone"
                value={formik.values.emergencyContactPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.emergencyContactPhone && Boolean(formik.errors.emergencyContactPhone)}
                helperText={formik.touched.emergencyContactPhone && formik.errors.emergencyContactPhone}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                name="emergencyContactRelationship"
                label="Emergency Contact Relationship"
                value={formik.values.emergencyContactRelationship}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.emergencyContactRelationship && Boolean(formik.errors.emergencyContactRelationship)}
                helperText={formik.touched.emergencyContactRelationship && formik.errors.emergencyContactRelationship}
              >
                <MenuItem value="spouse">Spouse</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="child">Child</MenuItem>
                <MenuItem value="sibling">Sibling</MenuItem>
                <MenuItem value="friend">Friend</MenuItem>
                <MenuItem value="colleague">Colleague</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="accommodation"
                label="Accommodation Details"
                value={formik.values.accommodation}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.accommodation && Boolean(formik.errors.accommodation)}
                helperText={formik.touched.accommodation && formik.errors.accommodation}
              />
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formik.values.previousVisits}
                      onChange={(e) => formik.setFieldValue('previousVisits', e.target.checked)}
                    />
                  }
                  label="Have you visited this country before?"
                />
              </FormGroup>
              {formik.values.previousVisits && (
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  name="previousVisitDetails"
                  label="Details of Previous Visits"
                  value={formik.values.previousVisitDetails}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  sx={{ mt: 2 }}
                />
              )}
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <IndividualDocumentUpload
              requiredDocuments={requiredDocuments}
              onUploadComplete={(docType, document) => {
                setDocuments(prev => {
                  const filtered = prev.filter(d => d.type !== docType);
                  return [...filtered, { ...document, type: docType }];
                });
              }}
              applicationId={application?._id}
            />
          </Box>
        );

      case 4:
        return (
          <Box>
            <PaymentForm
              visaType={visaTypes.find(vt => vt._id === formik.values.visaTypeId)}
              applicationData={{
                id: application?._id,
                personalInfo: {
                  firstName: formik.values.firstName,
                  lastName: formik.values.lastName,
                  email: formik.values.email
                }
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={() => setActiveStep(3)}
              disabled={loading}
            />
          </Box>
        );

      case 5:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Application
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Name:</Typography>
                    <Typography>{formik.values.firstName} {formik.values.lastName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Email:</Typography>
                    <Typography>{formik.values.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Phone:</Typography>
                    <Typography>{formik.values.phone}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Nationality:</Typography>
                    <Typography>{formik.values.nationality}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Passport Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Passport Number:</Typography>
                    <Typography>{formik.values.passportNumber}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Issuing Country:</Typography>
                    <Typography>{formik.values.issuingCountry}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Expiry Date:</Typography>
                    <Typography>{formik.values.passportExpiryDate?.toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Travel Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Visa Type:</Typography>
                    <Typography>{visaTypes.find(vt => vt._id === formik.values.visaTypeId)?.name}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Purpose of Visit:</Typography>
                    <Typography>{formik.values.purposeOfVisit}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Arrival Date:</Typography>
                    <Typography>{formik.values.intendedArrivalDate?.toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Departure Date:</Typography>
                    <Typography>{formik.values.intendedDepartureDate?.toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {paymentCompleted && paymentData && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Payment Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Transaction ID:</Typography>
                      <Typography>{paymentData.transactionId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Amount:</Typography>
                      <Typography>{paymentData.currency} {paymentData.amount}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Payment Method:</Typography>
                      <Typography>Card ending in {paymentData.cardLast4}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Status:</Typography>
                      <Chip label={paymentData.status} color="success" size="small" />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Documents ({documents ? documents.length : 0})
                </Typography>
                {documents && documents.map((doc, index) => (
                  <Chip
                    key={index}
                    label={`${doc.type} - ${doc.originalName}`}
                    color="success"
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          {renderStepContent(activeStep)}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            {activeStep !== 0 && (
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Back
              </Button>
            )}
            <Button onClick={onCancel}>
              Cancel
            </Button>
          </Box>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={formik.handleSubmit}
                startIcon={<SendIcon />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Submit Application'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => {
                  handleNext();
                }}
                disabled={loading}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ApplicationForm;
