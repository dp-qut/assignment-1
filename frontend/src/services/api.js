// Re-export all services from authService for better organization
export { 
  default as authService,
  visaTypeService,
  documentService,
  applicationService,
  notificationService,
  adminService 
} from './authService';
