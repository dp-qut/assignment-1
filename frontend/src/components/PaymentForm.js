import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Button,
  Divider,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import paymentService from '../services/paymentService';

const PaymentForm = ({ 
  visaType, 
  applicationData, 
  onPaymentSuccess, 
  onCancel,
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fees, setFees] = useState(null);
  const [processingType, setProcessingType] = useState('standard');

  const validationSchema = Yup.object({
    cardNumber: Yup.string()
      .required('Card number is required')
      .matches(/^\d{16}$/, 'Card number must be 16 digits'),
    expiryMonth: Yup.string()
      .required('Expiry month is required')
      .matches(/^(0[1-9]|1[0-2])$/, 'Invalid month'),
    expiryYear: Yup.string()
      .required('Expiry year is required')
      .matches(/^\d{4}$/, 'Invalid year')
      .test('future-date', 'Card has expired', function(value) {
        if (!value || !this.parent.expiryMonth) return true;
        const currentDate = new Date();
        const expiryDate = new Date(parseInt(value), parseInt(this.parent.expiryMonth) - 1);
        return expiryDate >= currentDate;
      }),
    cvv: Yup.string()
      .required('CVV is required')
      .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
    cardHolderName: Yup.string()
      .required('Cardholder name is required')
      .min(2, 'Name too short'),
    billingAddress: Yup.string()
      .required('Billing address is required'),
    billingCity: Yup.string()
      .required('City is required'),
    billingZip: Yup.string()
      .required('ZIP/Postal code is required')
  });

  const formik = useFormik({
    initialValues: {
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      cardHolderName: '',
      billingAddress: '',
      billingCity: '',
      billingZip: '',
      saveCard: false
    },
    validationSchema,
    onSubmit: handlePayment
  });

  useEffect(() => {
    const calculateFees = () => {
      const calculatedFees = paymentService.calculateFees(visaType?.name, processingType);
      setFees(calculatedFees);
    };
    calculateFees();
  }, [visaType, processingType]);

  async function handlePayment(values) {
    try {
      setLoading(true);
      setError('');

      const paymentData = {
        amount: fees.total,
        currency: fees.currency,
        cardNumber: values.cardNumber,
        expiryMonth: values.expiryMonth,
        expiryYear: values.expiryYear,
        cvv: values.cvv,
        cardHolderName: values.cardHolderName,
        billingAddress: {
          address: values.billingAddress,
          city: values.billingCity,
          zip: values.billingZip
        },
        applicationId: applicationData?.id,
        visaTypeId: visaType?.id,
        processingType
      };

      const response = await paymentService.processPayment(paymentData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onPaymentSuccess(response.data);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  }

  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return numericValue.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, ''); // Remove spaces for storage
    if (value.length <= 16) {
      formik.setFieldValue('cardNumber', value);
    }
  };

  if (success) {
    return (
      <Box textAlign="center" py={4}>
        <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h5" gutterBottom color="success.main">
          Payment Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your visa application payment has been processed successfully.
          You will be redirected to the next step shortly.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment Information
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Payment Summary */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Payment Summary
            </Typography>
            
            {visaType && (
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Visa Type
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {visaType.name}
                </Typography>
              </Box>
            )}

            {/* Processing Type Selection */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Processing Type</FormLabel>
              <RadioGroup
                value={processingType}
                onChange={(e) => setProcessingType(e.target.value)}
              >
                <FormControlLabel 
                  value="standard" 
                  control={<Radio />} 
                  label="Standard (7-10 business days)" 
                />
                <FormControlLabel 
                  value="express" 
                  control={<Radio />} 
                  label="Express (3-5 business days) +50%" 
                />
                <FormControlLabel 
                  value="urgent" 
                  control={<Radio />} 
                  label="Urgent (1-2 business days) +100%" 
                />
              </RadioGroup>
            </FormControl>

            {fees && (
              <Box>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Base Fee" 
                      secondary={`${fees.currency} ${fees.baseFee}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Processing Fee" 
                      secondary={`${fees.currency} ${fees.processingFee}`} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Service Fee" 
                      secondary={`${fees.currency} ${fees.serviceFee}`} 
                    />
                  </ListItem>
                </List>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    {fees.currency} {fees.total}
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Security Info */}
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Box display="flex" alignItems="center" mb={1}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2">Secure Payment</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Your payment information is encrypted and secure. We never store your card details.
            </Typography>
          </Paper>
        </Grid>

        {/* Payment Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <CreditCardIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Card Information</Typography>
              </Box>

              <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="cardNumber"
                      label="Card Number"
                      value={formatCardNumber(formik.values.cardNumber)}
                      onChange={handleCardNumberChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.cardNumber && Boolean(formik.errors.cardNumber)}
                      helperText={formik.touched.cardNumber && formik.errors.cardNumber}
                      placeholder="1234 5678 9012 3456"
                      disabled={disabled || loading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="cardHolderName"
                      label="Cardholder Name"
                      value={formik.values.cardHolderName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.cardHolderName && Boolean(formik.errors.cardHolderName)}
                      helperText={formik.touched.cardHolderName && formik.errors.cardHolderName}
                      placeholder="John Doe"
                      disabled={disabled || loading}
                    />
                  </Grid>

                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      name="expiryMonth"
                      label="Month"
                      value={formik.values.expiryMonth}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.expiryMonth && Boolean(formik.errors.expiryMonth)}
                      helperText={formik.touched.expiryMonth && formik.errors.expiryMonth}
                      placeholder="MM"
                      disabled={disabled || loading}
                    />
                  </Grid>

                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      name="expiryYear"
                      label="Year"
                      value={formik.values.expiryYear}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.expiryYear && Boolean(formik.errors.expiryYear)}
                      helperText={formik.touched.expiryYear && formik.errors.expiryYear}
                      placeholder="YYYY"
                      disabled={disabled || loading}
                    />
                  </Grid>

                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      name="cvv"
                      label="CVV"
                      value={formik.values.cvv}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.cvv && Boolean(formik.errors.cvv)}
                      helperText={formik.touched.cvv && formik.errors.cvv}
                      placeholder="123"
                      type="password"
                      disabled={disabled || loading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Billing Address
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="billingAddress"
                      label="Address"
                      value={formik.values.billingAddress}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.billingAddress && Boolean(formik.errors.billingAddress)}
                      helperText={formik.touched.billingAddress && formik.errors.billingAddress}
                      disabled={disabled || loading}
                    />
                  </Grid>

                  <Grid item xs={8}>
                    <TextField
                      fullWidth
                      name="billingCity"
                      label="City"
                      value={formik.values.billingCity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.billingCity && Boolean(formik.errors.billingCity)}
                      helperText={formik.touched.billingCity && formik.errors.billingCity}
                      disabled={disabled || loading}
                    />
                  </Grid>

                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      name="billingZip"
                      label="ZIP/Postal Code"
                      value={formik.values.billingZip}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.billingZip && Boolean(formik.errors.billingZip)}
                      helperText={formik.touched.billingZip && formik.errors.billingZip}
                      disabled={disabled || loading}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={disabled || loading || !fees}
                    startIcon={loading ? <CircularProgress size={20} /> : <CreditCardIcon />}
                  >
                    {loading ? 'Processing...' : `Pay ${fees ? `${fees.currency} ${fees.total}` : ''}`}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentForm;