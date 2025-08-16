import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert
} from '@mui/material';
import PaymentForm from './PaymentForm';

const PaymentDemo = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const sampleVisaType = {
    id: 'visa-001',
    name: 'Tourist Visa',
    description: 'For tourism and leisure travel'
  };

  const sampleApplicationData = {
    id: 'app-001',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com'
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    setPaymentResult(paymentData);
    setShowPayment(false);
  };

  const handleCancel = () => {
    setShowPayment(false);
  };

  if (paymentResult) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="success" sx={{ mb: 3 }}>
          Payment completed successfully!
        </Alert>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Receipt
          </Typography>
          <Typography><strong>Transaction ID:</strong> {paymentResult.transactionId}</Typography>
          <Typography><strong>Amount:</strong> {paymentResult.currency} {paymentResult.amount}</Typography>
          <Typography><strong>Card:</strong> **** **** **** {paymentResult.cardLast4}</Typography>
          <Typography><strong>Status:</strong> {paymentResult.status}</Typography>
          <Typography><strong>Date:</strong> {new Date(paymentResult.processedAt).toLocaleString()}</Typography>
        </Paper>
        <Button 
          variant="outlined" 
          onClick={() => setPaymentResult(null)} 
          sx={{ mt: 2 }}
        >
          Start New Payment
        </Button>
      </Box>
    );
  }

  if (showPayment) {
    return (
      <Box sx={{ p: 3 }}>
        <PaymentForm
          visaType={sampleVisaType}
          applicationData={sampleApplicationData}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={handleCancel}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payment Demo
      </Typography>
      <Typography variant="body1" paragraph>
        This demo shows the integrated payment step for visa applications.
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sample Application Details
        </Typography>
        <Typography><strong>Visa Type:</strong> {sampleVisaType.name}</Typography>
        <Typography><strong>Applicant:</strong> {sampleApplicationData.personalInfo.firstName} {sampleApplicationData.personalInfo.lastName}</Typography>
        <Typography><strong>Email:</strong> {sampleApplicationData.personalInfo.email}</Typography>
      </Paper>

      <Button 
        variant="contained" 
        size="large"
        onClick={() => setShowPayment(true)}
      >
        Start Payment Process
      </Button>
    </Box>
  );
};

export default PaymentDemo;
