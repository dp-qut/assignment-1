import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Person as PersonIcon,
  ContactMail as ContactIcon,
  FlightTakeoff as FlightIcon,
  Description as DocumentIcon,
  Event as EventIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { documentService } from '../services/api';

const ApplicationViewer = ({ application }) => {
  const [documentDialog, setDocumentDialog] = useState({ open: false, document: null });

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      submitted: 'primary',
      underReview: 'warning',
      approved: 'success',
      rejected: 'error',
      additionalInfoRequired: 'info',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <ScheduleIcon />,
      submitted: <InfoIcon />,
      underReview: <ScheduleIcon />,
      approved: <CheckIcon />,
      rejected: <ErrorIcon />,
      additionalInfoRequired: <InfoIcon />,
      cancelled: <ErrorIcon />
    };
    return icons[status] || <ScheduleIcon />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDocument = (document) => {
    setDocumentDialog({ open: true, document });
  };

  const handleDownloadDocument = async (document) => {
    try {
      const response = await documentService.downloadDocument(document._id);
      const blob = new Blob([response.data], { type: document.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download document error:', err);
    }
  };

  const statusHistory = application.statusHistory || [
    {
      status: application.status,
      timestamp: application.updatedAt,
      comment: 'Current status'
    }
  ];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box mb={4}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Application Details
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Application ID: {application.applicationNumber || application._id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created: {formatDateTime(application.createdAt)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
            <Chip
              label={application.status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              color={getStatusColor(application.status)}
              size="large"
              icon={getStatusIcon(application.status)}
              sx={{ mb: 2 }}
            />
            <Box>
              <Typography variant="body2" color="text.secondary">
                Last Updated: {formatDateTime(application.updatedAt)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Application Details */}
        <Grid item xs={12} lg={8}>
          {/* Personal Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Personal Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Full Name</Typography>
                  <Typography variant="body1">
                    {(application.userId?.firstName && application.userId?.lastName) ? 
                      `${application.userId.firstName} ${application.userId.lastName}` : 
                      (application.userId?.profile?.firstName && application.userId?.profile?.lastName) ? 
                      `${application.userId.profile.firstName} ${application.userId.profile.lastName}` :
                      (application.personalInfo?.firstName && application.personalInfo?.lastName) ?
                      `${application.personalInfo.firstName} ${application.personalInfo.lastName}` :
                      'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Date of Birth</Typography>
                  <Typography variant="body1">
                    {formatDate(application.userId?.profile?.dateOfBirth || application.personalInfo?.dateOfBirth)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Nationality</Typography>
                  <Typography variant="body1">
                    {application.personalInfo?.nationality || application.userId?.profile?.nationality || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Gender</Typography>
                  <Typography variant="body1">
                    {(application.userId?.gender || application.userId?.profile?.gender || application.personalInfo?.gender) ? 
                      (application.userId?.gender || application.userId?.profile?.gender || application.personalInfo?.gender).charAt(0).toUpperCase() + 
                      (application.userId?.gender || application.userId?.profile?.gender || application.personalInfo?.gender).slice(1) 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Marital Status</Typography>
                  <Typography variant="body1">
                    {application.personalInfo?.maritalStatus ? 
                      application.personalInfo.maritalStatus.charAt(0).toUpperCase() + application.personalInfo.maritalStatus.slice(1) 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Occupation</Typography>
                  <Typography variant="body1">
                    {application.personalInfo?.occupation || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ContactIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Contact Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">
                    {application.userId?.email || application.personalInfo?.email || application.contactInfo?.email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">
                    {application.userId?.profile?.phone || application.personalInfo?.phone || application.contactInfo?.phone || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Passport Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DocumentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Passport Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Passport Number</Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {application.personalInfo?.passportNumber || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Issuing Country</Typography>
                  <Typography variant="body1">
                    {application.personalInfo?.passportIssuingCountry || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Issue Date</Typography>
                  <Typography variant="body1">
                    {formatDate(application.personalInfo?.passportIssueDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                  <Typography variant="body1">
                    {formatDate(application.personalInfo?.passportExpiryDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Place of Birth</Typography>
                  <Typography variant="body1">
                    {application.personalInfo?.placeOfBirth || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Travel Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <FlightIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Travel Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Visa Type</Typography>
                  <Typography variant="body1">
                    {application.visaType?.name || 'Not specified'}
                  </Typography>
                  {application.visaType?.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {application.visaType.description}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Purpose of Visit</Typography>
                  <Typography variant="body1">
                    {application.purpose || application.travelInfo?.purpose || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Intended Arrival</Typography>
                  <Typography variant="body1">
                    {formatDate(application.travelInfo?.intendedDateOfArrival)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Intended Departure</Typography>
                  <Typography variant="body1">
                    {formatDate(application.travelInfo?.intendedDateOfDeparture)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Duration of Stay</Typography>
                  <Typography variant="body1">
                    {application.travelInfo?.durationOfStay ? `${application.travelInfo.durationOfStay} days` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Accommodation Type</Typography>
                  <Typography variant="body1">
                    {application.travelInfo?.accommodationType ? 
                      application.travelInfo.accommodationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Destination</Typography>
                  <Typography variant="body1">
                    {application.travelInfo?.destinationAddress ? 
                      `${application.travelInfo.destinationAddress.city}, ${application.travelInfo.destinationAddress.country}` 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Previous Visits</Typography>
                  <Typography variant="body1">
                    {application.travelInfo?.previousVisits && application.travelInfo.previousVisits.length > 0 ? 'Yes' : 'No'}
                  </Typography>
                  {application.travelInfo?.previousVisits && application.travelInfo.previousVisits.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {application.travelInfo.previousVisits.map((visit, index) => (
                        <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
                          • {visit.country} - {formatDate(visit.dateOfVisit)} ({visit.duration} days, {visit.purpose})
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DocumentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Financial Information</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Available Funds</Typography>
                  <Typography variant="body1">
                    {application.financialInfo?.fundsAvailable ? 
                      `${application.financialInfo.currency || 'USD'} ${application.financialInfo.fundsAvailable.toLocaleString()}` 
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Source of Funds</Typography>
                  <Typography variant="body1">
                    {application.financialInfo?.sourceOfFunds ? 
                      application.financialInfo.sourceOfFunds.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                      : 'N/A'}
                  </Typography>
                </Grid>
                {application.financialInfo?.sponsorInfo?.hasSponsorship && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Sponsor Information</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Sponsor Name</Typography>
                      <Typography variant="body1">
                        {application.financialInfo.sponsorInfo.sponsorName || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Relationship</Typography>
                      <Typography variant="body1">
                        {application.financialInfo.sponsorInfo.sponsorRelationship || 'N/A'}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ContactIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Emergency Contact</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Contact Name</Typography>
                  <Typography variant="body1">
                    {application.emergencyContact?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Relationship</Typography>
                  <Typography variant="body1">
                    {application.emergencyContact?.relationship || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">
                    {application.emergencyContact?.phone || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">
                    {application.emergencyContact?.email || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DocumentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Documents ({application.documents?.length || 0})</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {application.documents && application.documents.length > 0 ? (
                <List>
                  {application.documents.map((document, index) => (
                    <ListItem key={index} divider={index < application.documents.length - 1}>
                      <ListItemIcon>
                        <DocumentIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={document.originalName}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              Type: {document.type} • Size: {Math.round(document.size / 1024)} KB
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Uploaded: {formatDateTime(document.uploadDate)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewDocument(document)}
                          sx={{ mr: 1 }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadDocument(document)}
                        >
                          Download
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" textAlign="center" py={2}>
                  No documents uploaded
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Status & Timeline */}
        <Grid item xs={12} lg={4}>
          {/* Status Timeline */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EventIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Status History</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Timeline>
                {statusHistory.map((entry, index) => (
                  <TimelineItem key={index}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} variant="body2" color="text.secondary">
                      {formatDateTime(entry.timestamp)}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={getStatusColor(entry.status)}>
                        {getStatusIcon(entry.status)}
                      </TimelineDot>
                      {index < statusHistory.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="h6" component="span">
                        {entry.status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Typography>
                      {entry.comment && (
                        <Typography variant="body2" color="text.secondary">
                          {entry.comment}
                        </Typography>
                      )}
                      {entry.reviewedBy && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Reviewed by: {entry.reviewedBy}
                        </Typography>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>

          {/* Processing Information */}
          {application.visaType?.processingTime && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Expected Processing Time</Typography>
                    <Typography variant="body1">
                      {application.visaType.processingTime} business days
                    </Typography>
                  </Grid>
                  {application.visaType.fee && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Processing Fee</Typography>
                      <Typography variant="body1">
                        ${application.visaType.fee}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Document Preview Dialog */}
      <Dialog
        open={documentDialog.open}
        onClose={() => setDocumentDialog({ open: false, document: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Document Preview: {documentDialog.document?.originalName}
        </DialogTitle>
        <DialogContent>
          {documentDialog.document && (
            <Box>
              {documentDialog.document.mimeType?.startsWith('image/') ? (
                <img
                  src={documentDialog.document.url}
                  alt={documentDialog.document.originalName}
                  style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                />
              ) : documentDialog.document.mimeType === 'application/pdf' ? (
                <embed
                  src={documentDialog.document.url}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                />
              ) : (
                <Box textAlign="center" py={4}>
                  <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Preview not available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Click download to view this document
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadDocument(documentDialog.document)}
                  >
                    Download
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialog({ open: false, document: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationViewer;
