import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Alert,
  Snackbar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Layout from './common/Layout';

const Settings = () => {
  const { user, changePassword } = useAuth();
  const [preferences, setPreferences] = useState({
    emailNotifications: user?.preferences?.notifications?.email ?? true,
    smsNotifications: user?.preferences?.notifications?.sms ?? false,
    language: user?.preferences?.language ?? 'en'
  });
  
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handlePreferenceChange = (name) => (event) => {
    setPreferences(prev => ({
      ...prev,
      [name]: event.target.checked
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePreferences = async () => {
    try {
      // TODO: Implement save preferences API call
      setSuccess('Preferences saved successfully!');
    } catch (err) {
      setError('Failed to save preferences');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password changed successfully!');
    } catch (err) {
      setError('Failed to change password');
    }
  };

  return (
    <Layout fullWidth>
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        {/* Disabled Notice */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Settings modification is currently disabled. This feature will be available soon.
        </Alert>

        <Grid container spacing={3}>
          {/* Notification Preferences */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Preferences
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.emailNotifications}
                        onChange={handlePreferenceChange('emailNotifications')}
                        color="primary"
                        disabled
                      />
                    }
                    label="Email Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Receive updates about your applications via email
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.smsNotifications}
                        onChange={handlePreferenceChange('smsNotifications')}
                        color="primary"
                        disabled
                      />
                    }
                    label="SMS Notifications"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Receive important updates via SMS
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleSavePreferences}
                    disabled
                  >
                    Save Preferences
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Security */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Security
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Keep your account secure by regularly updating your password
                  </Typography>
                  
                  <Button 
                    variant="outlined" 
                    onClick={() => setPasswordDialog(true)}
                    sx={{ mt: 2 }}
                    disabled
                  >
                    Change Password
                  </Button>
                </Box>
                
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Two-Factor Authentication
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Add an extra layer of security to your account
                  </Typography>
                  <Button 
                    variant="outlined" 
                    disabled
                    sx={{ mt: 1 }}
                  >
                    Enable 2FA (Coming Soon)
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Account ID
                    </Typography>
                    <Typography variant="body1">
                      {user?._id}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Account Type
                    </Typography>
                    <Typography variant="body1">
                      {user?.role === 'admin' ? 'Administrator' : 'User'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email Status
                    </Typography>
                    <Typography variant="body1" color={user?.emailVerified ? 'success.main' : 'warning.main'}>
                      {user?.emailVerified ? 'Verified' : 'Not Verified'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Login
                    </Typography>
                    <Typography variant="body1">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              type="password"
              label="New Password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              margin="normal"
              helperText="Password must be at least 6 characters with uppercase, lowercase, and number"
            />
            
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword} 
              variant="contained"
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              Change Password
            </Button>
          </DialogActions>
        </Dialog>

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

export default Settings;
