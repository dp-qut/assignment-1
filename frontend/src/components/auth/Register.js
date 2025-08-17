import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { transparentTextFieldSx, transparentButtonSx } from '../../assets/authPageStyles';
// Import your background image here
import backgroundImage from '../../assets/bg-image.jpg';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      return updated;
    });
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    
    if (!formData.firstName || !formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50) {
      errors.firstName = 'First name must be between 2 and 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      errors.firstName = 'First name can only contain letters and spaces';
    }
    
    if (!formData.lastName || !formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be between 2 and 50 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      errors.lastName = 'Last name can only contain letters and spaces';
    }
    
    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phone || !formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
      errors.phone = 'Phone number is invalid';
    }
    
    if (!formData.nationality || !formData.nationality.trim()) {
      errors.nationality = 'Nationality is required';
    } else if (formData.nationality.trim().length < 2 || formData.nationality.trim().length > 50) {
      errors.nationality = 'Nationality must be between 2 and 50 characters';
    }
    
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = Math.floor((new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 16) {
        errors.dateOfBirth = 'Must be at least 16 years old';
      }
      if (age > 120) {
        errors.dateOfBirth = 'Please provide a valid date of birth';
      }
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Structure the data to match backend expectations
    const userData = {
      email: formData.email.trim(),
      password: formData.password,
      profile: {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        nationality: formData.nationality.trim(),
        dateOfBirth: formData.dateOfBirth,
        phone: formData.phone.trim()
      }
    };
    
    const result = await register(userData);
    
    if (result.success) {
      navigate('/login', { 
        state: { 
          message: 'Registration successful! Please check your email to verify your account.' 
        }
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Use background shorthand with image and fallback
        background: `url(${backgroundImage}), linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        // Add overlay for better text readability
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dark overlay
          zIndex: 1
        },
        padding: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          position: 'relative',
          zIndex: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.15)', // More transparent
          backdropFilter: 'blur(15px)', // Stronger blur effect
          border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle border
          borderRadius: '16px', // Rounded corners
          // Glass morphism effect
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            borderRadius: 'inherit',
            zIndex: -1
          }
        }}
      >
        <CardContent sx={{ 
          p: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.1)', // Subtle background for content
          borderRadius: '12px',
          margin: '8px',
          backdropFilter: 'blur(5px)'
        }}>
          {/* Header */}
          <Box textAlign="center" mb={4}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                color: '#1a1a1a',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(255,255,255,0.5)'
              }}
            >
              E-Visa Portal
            </Typography>
            <Typography 
              variant="h6" 
              color="primary" 
              gutterBottom
              sx={{ 
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(255,255,255,0.3)'
              }}
            >
              Create Account
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#4a4a4a',
                fontWeight: '500',
                textShadow: '0 1px 2px rgba(255,255,255,0.3)'
              }}
            >
              Join thousands of travelers using our visa services
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  sx={transparentTextFieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  sx={transparentTextFieldSx}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              margin="normal"
              sx={transparentTextFieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              margin="normal"
              sx={transparentTextFieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="nationality"
              label="Nationality"
              value={formData.nationality}
              onChange={handleChange}
              error={!!formErrors.nationality}
              helperText={formErrors.nationality}
              margin="normal"
              placeholder="e.g., American, British, Indian"
              sx={transparentTextFieldSx}
            />

            <TextField
              fullWidth
              name="dateOfBirth"
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              error={!!formErrors.dateOfBirth}
              helperText={formErrors.dateOfBirth}
              margin="normal"
              sx={transparentTextFieldSx}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              margin="normal"
              sx={transparentTextFieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              margin="normal"
              sx={transparentTextFieldSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link to="/terms" style={{ color: 'inherit' }}>
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" style={{ color: 'inherit' }}>
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{ mt: 2, mb: formErrors.agreeToTerms ? 1 : 0 }}
            />
            {formErrors.agreeToTerms && (
              <Typography variant="caption" color="error" display="block">
                {formErrors.agreeToTerms}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.5,
                ...transparentButtonSx
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Debug button - remove in production */}
            <Button
              type="button"
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => {
                alert('Check console for form data');
              }}
              sx={{ mb: 1 }}
            >
              Debug: Show Form Data
            </Button>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Already have an account?
              </Typography>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="outlined" fullWidth>
                  Sign In
                </Button>
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
