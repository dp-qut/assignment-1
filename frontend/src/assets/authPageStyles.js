import backgroundImage from './bg-image.jpg'; // Replace with your actual image

// Transparent text field styling
const transparentTextFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // More transparent
    backdropFilter: 'blur(5px)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.6)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1976d2',
      borderWidth: 2,
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.25)', // Stay transparent when focused
    },
  },
  '& .MuiInputLabel-root': {
    color: '#333',
    fontWeight: '500',
    '&.Mui-focused': {
      color: '#1976d2',
    },
  },
  '& .MuiInputBase-input': {
    color: '#1a1a1a',
    fontWeight: '500',
    '&::placeholder': {
      color: 'rgba(26, 26, 26, 0.7)',
    },
  },
  '& .MuiFormHelperText-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    margin: '4px 0 0 0',
    padding: '2px 8px',
    borderRadius: '4px',
  },
};

// Transparent button styling
const transparentButtonSx = {
  backgroundColor: 'rgba(25, 118, 210, 0.8)', // Transparent blue
  backdropFilter: 'blur(10px)',
  '&:hover': {
    backgroundColor: 'rgba(21, 101, 192, 0.9)',
  },
  '&:disabled': {
    backgroundColor: 'rgba(25, 118, 210, 0.4)',
  },
};

// In your Login.js or Register.js component, use this style:

const authPageStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Set the background image
    backgroundImage: `url(${backgroundImage})`,
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
  },
  card: {
    maxWidth: 400, // 500 for register
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    position: 'relative',
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly transparent
    backdropFilter: 'blur(10px)' // Glass effect
  }
};

// Usage in component:
// <Box sx={authPageStyles.container}>
//   <Card sx={authPageStyles.card}>
//     {/* Your form content */}
//   </Card>
// </Box>

export { transparentTextFieldSx, transparentButtonSx };

export default authPageStyles;
