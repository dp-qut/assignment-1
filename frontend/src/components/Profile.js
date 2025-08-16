import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Layout from './common/Layout';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.profile?.firstName || '',
    lastName: user?.profile?.lastName || '',
    phone: user?.profile?.phone || '',
    nationality: user?.profile?.nationality || '',
    dateOfBirth: user?.profile?.dateOfBirth?.split('T')[0] || ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      phone: user?.profile?.phone || '',
      nationality: user?.profile?.nationality || '',
      dateOfBirth: user?.profile?.dateOfBirth?.split('T')[0] || ''
    });
    setEditing(false);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Layout fullWidth>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>

        {/* Disabled Notice */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Profile editing is currently disabled. This feature will be available soon.
        </Alert>

        <Grid container spacing={3}>
          {/* Profile Summary */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Avatar
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    margin: '0 auto 16px',
                    bgcolor: 'primary.main',
                    fontSize: '2rem'
                  }}
                >
                  {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                </Avatar>
                
                <Typography variant="h5" gutterBottom>
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>
                
                <Chip 
                  label={user?.role === 'admin' ? 'Administrator' : 'User'} 
                  color={user?.role === 'admin' ? 'primary' : 'default'}
                  sx={{ mt: 1 }}
                />
                
                <Box sx={{ mt: 2 }}>
                  <Chip 
                    label={user?.emailVerified ? 'Email Verified' : 'Email Not Verified'} 
                    color={user?.emailVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Profile Details */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">
                    Personal Information
                  </Typography>
                  
                  {!editing ? (
                    <Button 
                      variant="outlined" 
                      onClick={() => setEditing(true)}
                      disabled
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Box>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancel}
                        sx={{ mr: 1 }}
                        disabled
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        onClick={handleSave}
                        disabled
                      >
                        Save Changes
                      </Button>
                    </Box>
                  )}
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={user?.email || ''}
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      disabled
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      disabled
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Member Since"
                      value={new Date(user?.createdAt || '').toLocaleDateString()}
                      disabled
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Success/Error Notifications */}
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess('')}
        >
          <Alert onClose={() => setSuccess('')} severity="success">
            {success}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
        >
          <Alert onClose={() => setError('')} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default Profile;
