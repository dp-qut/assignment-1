import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Delete,
  Description,
  Image,
  PictureAsPdf
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { documentService } from '../services/api';

const UploadBox = styled(Card)(({ theme, isDragOver, hasFile }) => ({
  border: `2px dashed ${
    hasFile ? theme.palette.success.main : 
    isDragOver ? theme.palette.primary.main : 
    theme.palette.grey[300]
  }`,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: hasFile ? theme.palette.success.light + '20' : 'transparent',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  }
}));

const HiddenInput = styled('input')({
  display: 'none'
});

const FileIcon = ({ mimeType }) => {
  if (mimeType?.startsWith('image/')) return <Image color="primary" />;
  if (mimeType === 'application/pdf') return <PictureAsPdf color="error" />;
  return <Description color="action" />;
};

const IndividualDocumentUpload = ({ 
  requiredDocuments = [], 
  onUploadComplete, 
  applicationId 
}) => {
  const [uploadStates, setUploadStates] = useState({});
  const [dragStates, setDragStates] = useState({});

  const updateUploadState = (docType, updates) => {
    setUploadStates(prev => ({
      ...prev,
      [docType]: { ...prev[docType], ...updates }
    }));
  };

  const handleFileSelect = async (docType, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/jpg', 
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      updateUploadState(docType, {
        error: 'Only JPEG, PNG, and PDF files are allowed'
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      updateUploadState(docType, {
        error: 'File size must be less than 5MB'
      });
      return;
    }

    updateUploadState(docType, {
      file,
      uploading: true,
      progress: 0,
      error: null
    });

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', docType);
      if (applicationId) {
        formData.append('applicationId', applicationId);
      }

      const response = await documentService.uploadDocument(formData, (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        updateUploadState(docType, { progress });
      });

      updateUploadState(docType, {
        uploading: false,
        uploaded: true,
        documentId: response.data.data.document._id,
        filePath: response.data.data.document.url
      });

      if (onUploadComplete) {
        onUploadComplete(docType, response.data.data.document);
      }

    } catch (error) {
      console.error('Upload error:', error);
      updateUploadState(docType, {
        uploading: false,
        error: error.response?.data?.message || 'Upload failed'
      });
    }
  };

  const handleDrop = (e, docType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [docType]: false }));
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(docType, files[0]);
    }
  };

  const handleDragOver = (e, docType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [docType]: true }));
  };

  const handleDragLeave = (e, docType) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [docType]: false }));
  };

  const removeFile = (docType) => {
    setUploadStates(prev => ({
      ...prev,
      [docType]: {}
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadStatus = (docType) => {
    const state = uploadStates[docType];
    if (!state) return 'pending';
    if (state.uploaded) return 'success';
    if (state.uploading) return 'uploading';
    if (state.error) return 'error';
    if (state.file) return 'ready';
    return 'pending';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success';
      case 'uploading': return 'info';
      case 'error': return 'error';
      case 'ready': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return 'Uploaded';
      case 'uploading': return 'Uploading...';
      case 'error': return 'Failed';
      case 'ready': return 'Ready to upload';
      default: return 'Required';
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Required Documents
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please upload each required document. Files must be in JPEG, PNG, or PDF format and under 5MB.
      </Typography>

      <Grid container spacing={3}>
        {requiredDocuments.map((docType) => {
          const state = uploadStates[docType] || {};
          const isDragOver = dragStates[docType];
          const status = getUploadStatus(docType);

          return (
            <Grid item xs={12} md={6} key={docType}>
              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                  <Chip
                    label={getStatusText(status)}
                    color={getStatusColor(status)}
                    size="small"
                    icon={
                      status === 'success' ? <CheckCircle /> :
                      status === 'error' ? <Error /> :
                      undefined
                    }
                  />
                </Box>

                <UploadBox
                  isDragOver={isDragOver}
                  hasFile={state.file || state.uploaded}
                  onDrop={(e) => handleDrop(e, docType)}
                  onDragOver={(e) => handleDragOver(e, docType)}
                  onDragLeave={(e) => handleDragLeave(e, docType)}
                  onClick={() => {
                    if (!state.uploading && !state.uploaded) {
                      document.getElementById(`file-input-${docType}`).click();
                    }
                  }}
                >
                  <CardContent>
                    {state.uploaded ? (
                      <Box>
                        <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="body1" color="success.main">
                          Document Uploaded Successfully
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {state.file?.name}
                        </Typography>
                      </Box>
                    ) : state.file ? (
                      <Box>
                        <FileIcon mimeType={state.file.type} />
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          {state.file.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(state.file.size)}
                        </Typography>
                        
                        {state.uploading && (
                          <Box sx={{ mt: 2 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={state.progress || 0} 
                            />
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {state.progress || 0}%
                            </Typography>
                          </Box>
                        )}

                        {!state.uploading && !state.uploaded && (
                          <Box sx={{ mt: 2 }}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileSelect(docType, state.file);
                              }}
                              sx={{ mr: 1 }}
                            >
                              Upload
                            </Button>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(docType);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box>
                        <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                        <Typography variant="body1">
                          Drop file here or click to upload
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          JPEG, PNG, PDF • Max 5MB
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </UploadBox>

                {state.error && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {state.error}
                  </Alert>
                )}

                <HiddenInput
                  id={`file-input-${docType}`}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleFileSelect(docType, e.target.files[0]);
                    }
                  }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Summary */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Upload Summary
        </Typography>
        <List>
          {requiredDocuments.map((docType) => {
            const state = uploadStates[docType] || {};
            const status = getUploadStatus(docType);
            
            return (
              <ListItem key={docType}>
                <ListItemIcon>
                  {status === 'success' ? (
                    <CheckCircle color="success" />
                  ) : status === 'error' ? (
                    <Error color="error" />
                  ) : (
                    <Description color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  secondary={
                    state.file ? state.file.name : 
                    state.error ? state.error : 
                    'Not uploaded'
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={getStatusText(status)}
                    color={getStatusColor(status)}
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default IndividualDocumentUpload;
