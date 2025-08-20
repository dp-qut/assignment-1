import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Grid,
  Paper,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { applicationService } from '../services/api';

const ApplicationStatusViewer = ({ applicationId, compact = false }) => {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(!compact);
  const [detailsDialog, setDetailsDialog] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [applicationId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadApplication = async () => {
    if (!applicationId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await applicationService.getApplicationById(applicationId);
      setApplication(response.data.data.application);
    } catch (err) {
      setError('Failed to load application status');
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'primary',
      under_review: 'warning',
      additional_docs_required: 'info',
      interview_scheduled: 'secondary',
      approved: 'success',
      rejected: 'error',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <AssignmentIcon />,
      submitted: <ScheduleIcon />,
      under_review: <InfoIcon />,
      additional_docs_required: <WarningIcon />,
      interview_scheduled: <CalendarIcon />,
      approved: <CheckIcon />,
      rejected: <CancelIcon />,
      cancelled: <CancelIcon />
    };
    return icons[status] || <InfoIcon />;
  };

  const formatStatusText = (status) => {
    return status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusHistory = () => {
    if (!application?.statusHistory || application.statusHistory.length === 0) {
      return (
        <Alert severity="info">
          No status updates available yet.
        </Alert>
      );
    }

    return (
      <Box>
        {application.statusHistory.map((history, index) => (
          <Paper 
            key={index} 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mb: 2,
              bgcolor: index === 0 ? 'primary.50' : 'background.paper',
              border: index === 0 ? 2 : 1,
              borderColor: index === 0 ? 'primary.main' : 'divider'
            }}
          >
            <Box display="flex" alignItems="flex-start" gap={2}>
              <Chip
                icon={getStatusIcon(history.status)}
                label={formatStatusText(history.status)}
                color={getStatusColor(history.status)}
                size="small"
              />
              <Box flex={1}>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(history.changedAt)}
                </Typography>
                {history.notes && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Admin Note:</strong> {history.notes}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>
    );
  };

  const renderCurrentStatus = () => {
    if (!application) return null;

    const currentStatus = application.status;
    const isApproved = currentStatus === 'approved';
    const isRejected = currentStatus === 'rejected';
    const needsAction = currentStatus === 'additional_docs_required';
    const hasInterview = currentStatus === 'interview_scheduled';

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Current Status
              </Typography>
              <Chip
                label={formatStatusText(currentStatus)}
                color={getStatusColor(currentStatus)}
                size="large"
                icon={getStatusIcon(currentStatus)}
              />
            </Box>
            {!compact && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => setDetailsDialog(true)}
              >
                View Details
              </Button>
            )}
          </Box>

          {application.reviewNotes && (
            <Alert 
              severity={isApproved ? 'success' : isRejected ? 'error' : needsAction ? 'warning' : 'info'}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2" fontWeight="medium">
                Admin Message:
              </Typography>
              <Typography variant="body2">
                {application.reviewNotes}
              </Typography>
            </Alert>
          )}

          {hasInterview && application.interviewInfo && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: 'primary.50' }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Interview Scheduled
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center">
                    <CalendarIcon sx={{ mr: 1 }} fontSize="small" />
                    <Typography variant="body2">
                      {formatDate(application.interviewInfo.scheduledDate)}
                    </Typography>
                  </Box>
                </Grid>
                {application.interviewInfo.location && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center">
                      <LocationIcon sx={{ mr: 1 }} fontSize="small" />
                      <Typography variant="body2">
                        {application.interviewInfo.location}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          )}

          {needsAction && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2" fontWeight="medium">
                Action Required
              </Typography>
              <Typography variant="body2">
                Please review the admin message above and take the necessary action.
                You may need to upload additional documents or provide more information.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderApplicationSummary = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Application Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Application Number</Typography>
            <Typography variant="body2" fontWeight="medium">
              {application.applicationNumber || application._id?.slice(-8).toUpperCase()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Visa Type</Typography>
            <Typography variant="body2" fontWeight="medium">
              {application.visaType?.name || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Submitted Date</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatDate(application.createdAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Expected Processing</Typography>
            <Typography variant="body2" fontWeight="medium">
              {application.expectedProcessingDays || 10} business days
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!application) {
    return (
      <Alert severity="info">
        Application not found.
      </Alert>
    );
  }

  return (
    <Box>
      {renderCurrentStatus()}
      
      {!compact && (
        <>
          {renderApplicationSummary()}
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Status History
                </Typography>
                <IconButton
                  onClick={() => setExpanded(!expanded)}
                  size="small"
                >
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expanded}>
                {renderStatusHistory()}
              </Collapse>
            </CardContent>
          </Card>
        </>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog}
        onClose={() => setDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Application Details
            </Typography>
            <IconButton onClick={() => setDetailsDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {renderApplicationSummary()}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Status History
            </Typography>
            {renderStatusHistory()}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationStatusViewer;
