/* Custom styling for transparent form fields */
const transparentFormStyles = {
  textField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(5px)',
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.5)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.8)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1976d2',
        borderWidth: 2,
      },
    },
    '& .MuiInputLabel-root': {
      color: '#333',
      fontWeight: '500',
    },
    '& .MuiInputBase-input': {
      color: '#1a1a1a',
      fontWeight: '500',
    },
  },
  button: {
    backgroundColor: 'rgba(25, 118, 210, 0.9)',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      backgroundColor: 'rgba(21, 101, 192, 0.95)',
    },
  }
};

export default transparentFormStyles;
