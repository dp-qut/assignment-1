import React from 'react';
import { Box, Container } from '@mui/material';
import Header from './Header';

const Layout = ({ children, maxWidth = 'lg', disableGutters = false, fullWidth = false }) => {
  if (fullWidth) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header />
        <Box sx={{ 
          py: { xs: 1, sm: 2, md: 3 }, 
          px: { xs: 1, sm: 2, md: 3 },
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden'
        }}>
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Container 
        maxWidth={maxWidth} 
        disableGutters={disableGutters}
        sx={{ py: 3 }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
