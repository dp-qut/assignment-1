import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Collapse,
  Tooltip,
  Badge,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Flight as FlightIcon,
  AttachMoney as MoneyIcon,
  ContactPhone as ContactIcon,
  Description as DocumentIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Info as InfoIcon,
  Visibility as ViewIcon,
  GetApp as GetAppIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Flag as FlagIcon,
  DateRange as DateRangeIcon,
  Home as HomeIcon,
  AccountBalance as BankIcon,
  Security as SecurityIcon,
  LocalHospital as MedicalIcon
} from '@mui/icons-material';
import { adminService } from '../../services/api';

const ApplicationDetailsDialog = ({ 
  open, 
  onClose, 
  application: initialApplication, 
  onStatusUpdate,
  onReload 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [application, setApplication] = useState(null);
  
  // Review form state
  const [reviewData, setReviewData] = useState({
    status: '',
    remarks: '',
    requiresInterview: false,
    interviewDate: '',
    additionalDocuments: []
  });
  
  // Document viewing
  const [documentPreview, setDocumentPreview] = useState(null);
  const [documentError, setDocumentError] = useState('');

  // Load full application details when dialog opens
  useEffect(() => {
    const loadApplicationDetails = async () => {
      if (open && initialApplication?._id) {
        setLoading(true);
        setError('');
        
        try {
          const response = await adminService.getApplicationById(initialApplication._id);
          setApplication(response.data.data.application);
        } catch (err) {
          setError('Failed to load application details');
          console.error('Load error:', err);
          // Fallback to initial application data
          setApplication(initialApplication);
        } finally {
          setLoading(false);
        }
      }
    };

    loadApplicationDetails();
  }, [open, initialApplication]);

  useEffect(() => {
    if (application) {
      setReviewData({
        status: application.status || '',
        remarks: application.reviewNotes || '',
        requiresInterview: application.interviewInfo?.isRequired || false,
        interviewDate: application.interviewInfo?.scheduledDate ? 
          new Date(application.interviewInfo.scheduledDate).toISOString().split('T')[0] : '',
        additionalDocuments: []
      });
    }
  }, [application]);

  const handleStatusUpdate = async () => {
    if (!reviewData.remarks.trim()) {
      setError('Remarks are required for status updates');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await adminService.updateApplicationStatus(application._id, {
        status: reviewData.status,
        reviewNotes: reviewData.remarks,
        requiresInterview: reviewData.requiresInterview,
        interviewDate: reviewData.interviewDate || null
      });

      setSuccess(`Application ${reviewData.status} successfully`);
      
      if (onStatusUpdate) {
        onStatusUpdate(application._id, reviewData.status, reviewData.remarks);
      }
      
      if (onReload) {
        onReload();
      }
      
      // Close dialog after a brief delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentDownload = async (document) => {
    try {
      setDocumentError('');
      const response = await adminService.downloadApplicationDocument(application._id, document._id);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: document.mimeType || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.originalName || document.filename || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setDocumentError('Failed to download document: ' + (err.response?.data?.message || err.message));
      console.error('Download error:', err);
    }
  };

  const handleDocumentView = async (document) => {
    try {
      setDocumentError('');
      setLoading(true);
      
      // For images, create preview URL
      if (document.mimeType?.startsWith('image/')) {
        const response = await adminService.downloadApplicationDocument(application._id, document._id);
        const blob = new Blob([response.data], { type: document.mimeType });
        const url = window.URL.createObjectURL(blob);
        setDocumentPreview({ url, type: 'image', name: document.originalName || document.filename });
      } else if (document.mimeType === 'application/pdf') {
        // For PDFs, create preview URL and show in new tab/dialog
        const response = await adminService.downloadApplicationDocument(application._id, document._id, true); // inline=true
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Option 1: Open in new tab
        window.open(url, '_blank');
        
        // Option 2: Set preview for dialog (uncomment if you prefer dialog)
        // setDocumentPreview({ url, type: 'pdf', name: document.originalName || document.filename });
        
        // Clean up URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        // For other document types, trigger download
        handleDocumentDownload(document);
      }
    } catch (err) {
      setDocumentError('Failed to view document: ' + (err.response?.data?.message || err.message));
      console.error('Document view error:', err);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getDocumentIcon = (type) => {
    const icons = {
      passport_copy: <AssignmentIcon />,
      photo: <PersonIcon />,
      bank_statement: <BankIcon />,
      employment_letter: <WorkIcon />,
      invitation_letter: <EmailIcon />,
      hotel_booking: <HomeIcon />,
      flight_itinerary: <FlightIcon />,
      travel_insurance: <SecurityIcon />,
      medical_certificate: <MedicalIcon />,
      police_clearance: <SecurityIcon />
    };
    return icons[type] || <DocumentIcon />;
  };

  const renderPersonalInfo = () => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center">
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Personal Information</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Basic Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Full Name" 
                    secondary={`${application.userId?.firstName || ''} ${application.userId?.lastName || ''}`.trim() || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Email" 
                    secondary={application.userId?.email || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><PhoneIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Phone" 
                    secondary={application.personalInfo?.phone || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><FlagIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Nationality" 
                    secondary={application.personalInfo?.nationality || 'N/A'} 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Passport Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Passport Number" 
                    secondary={application.personalInfo?.passportNumber || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Issue Date" 
                    secondary={formatDate(application.personalInfo?.passportIssueDate)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Expiry Date" 
                    secondary={formatDate(application.personalInfo?.passportExpiryDate)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Issuing Country" 
                    secondary={application.personalInfo?.passportIssuingCountry || 'N/A'} 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Additional Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Place of Birth</Typography>
                  <Typography variant="body2">{application.personalInfo?.placeOfBirth || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Marital Status</Typography>
                  <Typography variant="body2">{application.personalInfo?.maritalStatus || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Occupation</Typography>
                  <Typography variant="body2">{application.personalInfo?.occupation || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Gender</Typography>
                  <Typography variant="body2">{application.personalInfo?.gender || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderTravelInfo = () => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center">
          <FlightIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Travel Information</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Travel Dates
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><DateRangeIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Intended Arrival" 
                    secondary={formatDate(application.travelInfo?.intendedDateOfArrival)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><DateRangeIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Intended Departure" 
                    secondary={formatDate(application.travelInfo?.intendedDateOfDeparture)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><ScheduleIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Duration of Stay" 
                    secondary={`${application.travelInfo?.durationOfStay || 0} days`} 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Destination & Accommodation
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><LocationIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Destination" 
                    secondary={`${application.travelInfo?.destinationAddress?.city || ''}, ${application.travelInfo?.destinationAddress?.country || ''}`.replace(/^,\s*/, '') || 'N/A'} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><HomeIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Accommodation Type" 
                    secondary={application.travelInfo?.accommodationType || 'N/A'} 
                  />
                </ListItem>
                {application.travelInfo?.accommodationDetails?.name && (
                  <ListItem>
                    <ListItemText 
                      primary="Accommodation Details" 
                      secondary={application.travelInfo.accommodationDetails.name} 
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Purpose of Visit
              </Typography>
              <Typography variant="body1">
                {application.purpose || application.travelInfo?.purpose || 'N/A'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderFinancialInfo = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center">
          <MoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Financial Information</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Financial Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><BankIcon fontSize="small" /></ListItemIcon>
                  <ListItemText 
                    primary="Available Funds" 
                    secondary={formatCurrency(application.financialInfo?.fundsAvailable || 0, application.financialInfo?.currency)} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Source of Funds" 
                    secondary={application.financialInfo?.sourceOfFunds?.replace(/_/g, ' ') || 'N/A'} 
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          {application.financialInfo?.sponsorInfo?.hasSponsorship && (
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  Sponsor Information
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Sponsor Name" 
                      secondary={application.financialInfo.sponsorInfo.sponsorName || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Relationship" 
                      secondary={application.financialInfo.sponsorInfo.sponsorRelationship || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Contact" 
                      secondary={application.financialInfo.sponsorInfo.sponsorEmail || application.financialInfo.sponsorInfo.sponsorPhone || 'N/A'} 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );

  const renderEmergencyContact = () => (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center">
          <ContactIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Emergency Contact</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Name</Typography>
              <Typography variant="body2">{application.emergencyContact?.name || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Relationship</Typography>
              <Typography variant="body2">{application.emergencyContact?.relationship || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Phone</Typography>
              <Typography variant="body2">{application.emergencyContact?.phone || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography variant="body2">{application.emergencyContact?.email || 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      </AccordionDetails>
    </Accordion>
  );

  const renderDocuments = () => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center">
          <DocumentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Uploaded Documents</Typography>
          <Badge badgeContent={application.documents?.length || 0} color="primary" sx={{ ml: 1 }}>
            <Box />
          </Badge>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {application.documents && application.documents.length > 0 ? (
          <Grid container spacing={2}>
            {application.documents.map((document, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" alignItems="flex-start" mb={1}>
                      {getDocumentIcon(document.type)}
                      <Box ml={1} flex={1}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {document.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {document.originalName || document.filename}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Uploaded: {formatDate(document.uploadDate)}
                        </Typography>
                        {document.size && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Size: {(document.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Tooltip title="View Document">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDocumentView(document)}
                          disabled={loading}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Download Document">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDocumentDownload(document)}
                        >
                          <GetAppIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {document.verified && (
                        <Chip 
                          label="Verified" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Alert severity="info">
            No documents uploaded yet.
          </Alert>
        )}
        
        {documentError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {documentError}
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  );

  const renderReviewSection = () => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" color="primary">
          Admin Review & Decision
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box>
          {application.reviewNotes && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="medium">
                Previous Review Notes:
              </Typography>
              <Typography variant="body2">
                {application.reviewNotes}
              </Typography>
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Decision</InputLabel>
                <Select
                  value={reviewData.status}
                  onChange={(e) => setReviewData(prev => ({ ...prev, status: e.target.value }))}
                  label="Decision"
                >
                  <MenuItem value="approved">Approve</MenuItem>
                  <MenuItem value="rejected">Reject</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Remarks *"
                value={reviewData.remarks}
                onChange={(e) => setReviewData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter detailed remarks for this decision. This will be visible to the applicant."
                required
                error={!reviewData.remarks.trim() && submitting}
                helperText={!reviewData.remarks.trim() && submitting ? 'Remarks are required' : 'Provide clear and detailed feedback for the applicant'}
              />
            </Grid>

            {/* Interview scheduling */}
            <Collapse in={reviewData.status === 'interview_scheduled'} sx={{ width: '100%' }}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Interview Date"
                    value={reviewData.interviewDate}
                    onChange={(e) => setReviewData(prev => ({ ...prev, interviewDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  />
                </Grid>
              </Grid>
            </Collapse>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {success}
            </Alert>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );

  if (!application) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { maxHeight: '95vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">
                Application Details
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {application.applicationNumber || application._id?.slice(-8).toUpperCase()}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={application.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                color={getStatusColor(application.status)}
                size="small"
              />
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : error && !application ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">
                {error}
              </Alert>
            </Box>
          ) : application ? (
            <Box sx={{ p: 3 }}>
              {/* Application Overview */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Visa Type</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {application.visaType?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Submitted Date</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(application.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Processing Priority</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {application.priority?.toUpperCase() || 'NORMAL'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Fee Status</Typography>
                      <Chip 
                        label={'Paid'} 
                        color={'success'}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Application Sections */}
              <Box>
                {renderPersonalInfo()}
                {renderTravelInfo()}
                {renderFinancialInfo()}
                {renderEmergencyContact()}
                {renderDocuments()}
                {renderReviewSection()}
              </Box>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          
          <Box display="flex" gap={1}>
            {reviewData.status === 'rejected' && (
              <Button
                onClick={handleStatusUpdate}
                color="error"
                variant="contained"
                startIcon={submitting ? <CircularProgress size={20} /> : <RejectIcon />}
                disabled={submitting || !reviewData.remarks.trim()}
              >
                {submitting ? 'Rejecting...' : 'Reject Application'}
              </Button>
            )}
            
            {reviewData.status === 'approved' && (
              <Button
                onClick={handleStatusUpdate}
                color="success"
                variant="contained"
                startIcon={submitting ? <CircularProgress size={20} /> : <ApproveIcon />}
                disabled={submitting || !reviewData.remarks.trim()}
              >
                {submitting ? 'Approving...' : 'Approve Application'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog
        open={!!documentPreview}
        onClose={() => setDocumentPreview(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {documentPreview?.name || 'Document Preview'}
            </Typography>
            <IconButton onClick={() => setDocumentPreview(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {documentPreview?.type === 'image' && (
            <Box textAlign="center">
              <img
                src={documentPreview.url}
                alt="Document preview"
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </Box>
          )}
          {documentPreview?.type === 'pdf' && (
            <Box textAlign="center" sx={{ height: '70vh' }}>
              <iframe
                src={documentPreview.url}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="PDF Preview"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentPreview(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApplicationDetailsDialog;
