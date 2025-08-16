import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { documentService } from '../services/api';

const DocumentUpload = ({ documents, requiredDocuments, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewDialog, setPreviewDialog] = useState({ open: false, document: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, document: null });

  const allowedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  };

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.file.size > maxFileSize) {
          return `${file.file.name}: File too large (max 5MB)`;
        }
        return `${file.file.name}: Invalid file type`;
      });
      setError(errors.join(', '));
      return;
    }

    // Upload accepted files
    setUploading(true);
    const newDocuments = [...documents];

    for (const file of acceptedFiles) {
      const fileId = `${Date.now()}-${Math.random()}`;
      try {
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', 'application-document');

        const response = await documentService.uploadDocument(
          formData,
          (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({ ...prev, [fileId]: percentCompleted }));
          }
        );

        const documentData = {
          _id: response.data.fileId,
          type: 'Other', // Will be set by user
          originalName: file.name,
          filename: response.data.filename,
          size: file.size,
          mimeType: file.type,
          uploadDate: new Date().toISOString(),
          url: response.data.url
        };

        newDocuments.push(documentData);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

      } catch (err) {
        setError(`Failed to upload ${file.name}: ${err.response?.data?.message || err.message}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }

    onChange(newDocuments);
    setUploading(false);
    if (acceptedFiles.length > 0) {
      setSuccess(`Successfully uploaded ${acceptedFiles.length} file(s)`);
    }
  }, [documents, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes,
    maxSize: maxFileSize,
    multiple: true
  });

  const handleDocumentTypeChange = (documentId, newType) => {
    const updatedDocuments = documents.map(doc =>
      doc._id === documentId ? { ...doc, type: newType } : doc
    );
    onChange(updatedDocuments);
  };

  const handleDeleteDocument = async (document) => {
    try {
      await documentService.deleteDocument(document._id);
      const updatedDocuments = documents.filter(doc => doc._id !== document._id);
      onChange(updatedDocuments);
      setSuccess('Document deleted successfully');
      setDeleteDialog({ open: false, document: null });
    } catch (err) {
      setError('Failed to delete document');
      console.error('Delete document error:', err);
    }
  };

  const handlePreviewDocument = (document) => {
    setPreviewDialog({ open: true, document });
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
      setError('Failed to download document');
      console.error('Download document error:', err);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <ImageIcon />;
    if (mimeType === 'application/pdf') return <PdfIcon />;
    if (mimeType.includes('word')) return <DocIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isDocumentTypeComplete = () => {
    const uploadedTypes = documents.map(doc => doc.type);
    const missingTypes = requiredDocuments.filter(type => !uploadedTypes.includes(type));
    return missingTypes.length === 0;
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'action.hover' : 'background.default',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease'
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF (max 5MB each)
        </Typography>
      </Paper>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Uploading files...
          </Typography>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <Box key={fileId} mb={1}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Required Documents Status */}
      {requiredDocuments.length > 0 && (
        <Alert 
          severity={isDocumentTypeComplete() ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Document Requirements Status
          </Typography>
          <Grid container spacing={1}>
            {requiredDocuments.map((type, index) => {
              const isUploaded = documents.some(doc => doc.type === type);
              return (
                <Grid item key={index}>
                  <Chip
                    label={type}
                    color={isUploaded ? 'success' : 'default'}
                    size="small"
                    icon={isUploaded ? <ViewIcon /> : undefined}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Alert>
      )}

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Uploaded Documents ({documents.length})
          </Typography>
          
          <Grid container spacing={2}>
            {documents.map((document) => (
              <Grid item xs={12} sm={6} md={4} key={document._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      {getFileIcon(document.mimeType)}
                      <Box ml={1} flexGrow={1}>
                        <Typography variant="subtitle2" noWrap>
                          {document.originalName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(document.size)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Document Type:
                      </Typography>
                      <select
                        value={document.type}
                        onChange={(e) => handleDocumentTypeChange(document._id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      >
                        <option value="">Select Type</option>
                        {requiredDocuments.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => handlePreviewDocument(document)}
                      title="Preview"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadDocument(document)}
                      title="Download"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteDialog({ open: true, document })}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, document: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Document Preview: {previewDialog.document?.originalName}
        </DialogTitle>
        <DialogContent>
          {previewDialog.document && (
            <Box>
              {previewDialog.document.mimeType.startsWith('image/') ? (
                <img
                  src={previewDialog.document.url}
                  alt={previewDialog.document.originalName}
                  style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }}
                />
              ) : previewDialog.document.mimeType === 'application/pdf' ? (
                <embed
                  src={previewDialog.document.url}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                />
              ) : (
                <Box textAlign="center" py={4}>
                  <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Preview not available
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Click download to view this document
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadDocument(previewDialog.document)}
                  >
                    Download
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog({ open: false, document: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, document: null })}
        maxWidth="sm"
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDialog.document?.originalName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, document: null })}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleDeleteDocument(deleteDialog.document)} 
            color="error" 
            variant="contained"
          >
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
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentUpload;
