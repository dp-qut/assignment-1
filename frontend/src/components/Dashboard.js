import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FileDownload as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { applicationService } from '../services/api';
import ApplicationForm from './ApplicationForm';
import ApplicationViewer from './ApplicationViewer';
import ApplicationStatusViewer from './ApplicationStatusViewer';
import Layout from './common/Layout';

const Dashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    submitted: 0,
    underReview: 0,
    approved: 0,
    rejected: 0
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getMyApplications();
      
      // Extract applications from the nested response structure
      const applications = response.data?.data?.applications || [];
      setApplications(applications);
      
      // Calculate stats - make sure applications is an array
      const newStats = applications.reduce((acc, app) => {
        acc.total++;
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, { total: 0, draft: 0, submitted: 0, underReview: 0, approved: 0, rejected: 0 });
      
      setStats(newStats);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Load applications error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = () => {
    setSelectedApplication(null);
    setCreateDialogOpen(true);
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setViewDialogOpen(true);
  };

  const handleDeleteApplication = (application) => {
    setSelectedApplication(application);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await applicationService.deleteApplication(selectedApplication._id);
      setSuccess('Application deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedApplication(null);
      loadApplications();
    } catch (err) {
      setError('Failed to delete application');
      console.error('Delete application error:', err);
    }
  };

  const handleApplicationSaved = () => {
    setCreateDialogOpen(false);
    setSelectedApplication(null);
    setSuccess('Application saved successfully');
    loadApplications();
  };

  const handleDownloadApplication = async (applicationId) => {
    try {
      const response = await applicationService.downloadApplication(applicationId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `application-${applicationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download application');
      console.error('Download error:', err);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'primary',
      underReview: 'warning',
      approved: 'success',
      rejected: 'error',
      additionalInfoRequired: 'info'
    };
    return colors[status] || 'default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout fullWidth>
      <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Applications
        </Typography>
        <Box>
          <IconButton onClick={loadApplications} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateApplication}
            size={isMobile ? 'small' : 'medium'}
          >
            New Application
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Draft
              </Typography>
              <Typography variant="h4" color="textSecondary">
                {stats.draft}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Submitted
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.submitted}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Under Review
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.underReview}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Rejected
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Applications Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <Typography variant="h6" gutterBottom>
            Application History
          </Typography>
          
          {applications.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography color="textSecondary" mb={2}>
                No applications found
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateApplication}
              >
                Create Your First Application
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 500px)' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Application ID</TableCell>
                    <TableCell>Visa Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {application.applicationNumber || application._id.slice(-8)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {application.visaType?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={application.status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            color={getStatusColor(application.status)}
                            size="small"
                          />
                          {application.reviewNotes && (
                            <Tooltip title={`Admin Note: ${application.reviewNotes}`} arrow>
                              <IconButton size="small" color="info">
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {formatDate(application.createdAt)}
                      </TableCell>
                      <TableCell>
                        {formatDate(application.updatedAt)}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Application Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewApplication(application)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {/* Edit functionality removed as per requirements - users cannot edit after submission */}
                        
                        {['approved', 'rejected', 'submitted'].includes(application.status) && (
                          <Tooltip title="Download Application PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadApplication(application._id)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {application.status === 'draft' ? (
                          <Tooltip title="Delete Application">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteApplication(application)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title={`Cannot delete ${application.status} applications`}>
                            <span>
                              <IconButton
                                size="small"
                                disabled
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add application"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleCreateApplication}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Create/Edit Application Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {selectedApplication ? 'Edit Application' : 'Create New Application'}
        </DialogTitle>
        <DialogContent>
          <ApplicationForm
            application={selectedApplication}
            onSave={handleApplicationSaved}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Application Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Application Details
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              {/* Status and Remarks Section */}
              <ApplicationStatusViewer 
                applicationId={selectedApplication._id}
                compact={false}
              />
              
              {/* Detailed Application Data */}
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Application Details
                </Typography>
                <ApplicationViewer 
                  application={selectedApplication}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {['approved', 'rejected', 'submitted'].includes(selectedApplication?.status) && (
            <Button 
              startIcon={<DownloadIcon />}
              onClick={() => handleDownloadApplication(selectedApplication._id)}
              variant="outlined"
            >
              Download PDF
            </Button>
          )}
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this application? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
      </Box>
    </Layout>
  );
};

export default Dashboard;
