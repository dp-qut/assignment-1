export const paymentService = {
  // Simulate payment processing
  processPayment: async (paymentData) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate payment processing logic
      if (paymentData.cardNumber === '4000000000000002') {
        throw new Error('Card declined');
      }
      
      if (paymentData.amount < 10) {
        throw new Error('Minimum payment amount is $10');
      }
      
      // Return successful payment response
      return {
        success: true,
        data: {
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          status: 'completed',
          paymentMethod: 'card',
          cardLast4: paymentData.cardNumber.slice(-4),
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw error;
    }
  },

  // Get visa type pricing
  getVisaTypePricing: async (visaTypeId) => {
    // For now, return sample pricing since we don't have a pricing API endpoint yet
    return {
      success: true,
      data: {
        baseFee: 150,
        processingFee: 25,
        serviceFee: 15,
        total: 190,
        currency: 'USD'
      }
    };
  },

  // Calculate total fees
  calculateFees: (visaType, processingType = 'standard') => {
    const baseFees = {
      'tourist': { base: 100, processing: 20, service: 10 },
      'business': { base: 150, processing: 25, service: 15 },
      'student': { base: 120, processing: 30, service: 12 },
      'work': { base: 200, processing: 40, service: 20 },
      'transit': { base: 50, processing: 10, service: 5 }
    };

    const typeKey = visaType?.toLowerCase() || 'tourist';
    const fees = baseFees[typeKey] || baseFees['tourist'];

    let multiplier = 1;
    if (processingType === 'express') multiplier = 1.5;
    if (processingType === 'urgent') multiplier = 2;

    return {
      baseFee: Math.round(fees.base * multiplier),
      processingFee: Math.round(fees.processing * multiplier),
      serviceFee: fees.service,
      total: Math.round((fees.base + fees.processing + fees.service) * multiplier),
      currency: 'USD'
    };
  },

  // Validate payment details
  validatePaymentDetails: (paymentData) => {
    const errors = {};

    if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
      errors.cardNumber = 'Valid card number is required';
    }

    if (!paymentData.expiryMonth || !paymentData.expiryYear) {
      errors.expiry = 'Expiry date is required';
    } else {
      const currentDate = new Date();
      const expiryDate = new Date(paymentData.expiryYear, paymentData.expiryMonth - 1);
      if (expiryDate < currentDate) {
        errors.expiry = 'Card has expired';
      }
    }

    if (!paymentData.cvv || paymentData.cvv.length < 3) {
      errors.cvv = 'Valid CVV is required';
    }

    if (!paymentData.cardHolderName || paymentData.cardHolderName.trim().length < 2) {
      errors.cardHolderName = 'Cardholder name is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default paymentService;                                                                                                  