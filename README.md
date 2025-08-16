# 🛂 E-Visa Application Management System

A comprehensive, full-stack E-Visa Application Management System that streamlines the visa application process with role-based access control, document management, and payment integration.

## 🌟 Overview

This system provides a complete solution for managing electronic visa applications, featuring a modern React frontend and robust Node.js backend with MongoDB database integration.

### 🎯 Key Features

**For Applicants:**
- ✅ User registration and secure authentication
- ✅ Complete visa application workflow
- ✅ Document upload and management
- ✅ Real-time application status tracking
- ✅ Payment processing integration
- ✅ Email notifications and updates(In-Future)

**For Administrators:**
- ✅ Application review and processing
- ✅ User management and access control
- ✅ Visa type configuration
- ✅ Analytics and reporting dashboard
- ✅ Document verification system
- ✅ Bulk notification management

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend│    │   MongoDB       │
│                 │    │                 │    │   Database      │
│  • UI Components│◄──►│  • REST APIs    │◄──►│                 │
│  • State Mgmt   │    │  • Auth & Auth  │    │  • Users        │
│  • Routing      │    │  • File Uploads │    │  • Applications │
│  • Forms        │    │  • Email Service│    │  • Documents    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Material-UI   │    │   AWS S3        │    │   Mongoose ODM  │
│   Styling       │    │   File Storage  │    │   Data Models   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔄 Application Flow

### User Journey Flow
```
Registration → Email Verification → Login → Application Form → Document Upload 
     ↓              ↓                ↓           ↓               ↓
Profile Setup → Account Active → Dashboard → Form Submission → File Processing
     ↓              ↓                ↓           ↓               ↓
Complete → Status Tracking → Payment → Review Process → Decision
```

### Admin Workflow
```
Admin Login → Dashboard → Application Review → Status Update
     ↓            ↓             ↓                 ↓            
User Mgmt → Analytics → Document Verify → Approve/Reject
```

## 📂 Project Structure

```
E-Visa-Application/
├── 📁 backend/                 # Node.js Express Backend
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Business logic handlers
│   │   │   ├── authController.js
│   │   │   ├── applicationController.js
│   │   │   ├── adminController.js
│   │   │   └── userController.js
│   │   ├── 📁 models/          # MongoDB Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Application.js
│   │   │   ├── VisaType.js
│   │   │   └── Document.js
│   │   ├── 📁 routes/          # API route definitions
│   │   │   ├── authRoutes.js
│   │   │   ├── applicationRoutes.js
│   │   │   ├── adminRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── 📁 middleware/      # Custom middleware
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   ├── upload.js
│   │   │   └── rateLimiter.js
│   │   ├── 📁 services/        # External service integrations
│   │   │   ├── emailService.js
│   │   │   ├── fileService.js
│   │   │   └── paymentService.js
│   │   ├── 📁 utils/           # Helper functions
│   │   │   ├── validators.js
│   │   │   ├── formatters.js
│   │   │   └── constants.js
│   │   ├── 📁 config/          # Configuration files
│   │   │   └── database.js
│   │   └── 📄 server.js        # Application entry point
│   ├── 📁 uploads/             # Local file storage
│   ├── 📄 package.json
│   ├── 📄 .env.example
│   └── 📄 createAdmin.js       # Admin user setup
├── 📁 frontend/                # React Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/      # React components
│   │   │   ├── 📁 auth/        # Authentication components
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   ├── 📁 common/      # Shared components
│   │   │   │   ├── Header.js
│   │   │   │   └── Layout.js
│   │   │   ├── 📁 admin/       # Admin-specific components
│   │   │   │   ├── DashboardStats.js
│   │   │   │   └── ReportsComponent.js
│   │   │   ├── Dashboard.js    # User dashboard
│   │   │   ├── ApplicationForm.js
│   │   │   ├── DocumentUpload.js
│   │   │   ├── PaymentForm.js
│   │   │   └── AdminDashboard.js
│   │   ├── 📁 contexts/        # React context providers
│   │   │   ├── AuthContext.js
│   │   │   └── NotificationContext.js
│   │   ├── 📁 services/        # API service calls
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── paymentService.js
│   │   ├── 📁 utils/           # Utility functions
│   │   │   ├── validationHelpers.js
│   │   │   └── toastHelpers.js
│   │   ├── 📄 App.js           # Main application component
│   │   └── 📄 index.js         # Application entry point
│   ├── 📁 public/              # Static assets
│   ├── 📁 build/               # Production build files
│   ├── 📄 package.json
│   └── 📄 .env.example
├── 📁 docs/                    # Documentation
│   ├── 📁 api/                 # API documentation
│   ├── 📁 sysml/               # System design diagrams
│   └── 📁 jira/                # Project management docs
├── 📁 .github/                 # GitHub workflows
│   └── 📁 workflows/
│       └── ci-cd.yml
└── 📄 README.md                # This file
```

## 🛠️ Technology Stack

### Backend Technologies
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer + AWS S3
- **Payment**: Razorpay Integration
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Documentation**: Swagger/OpenAPI

### Frontend Technologies
- **Framework**: React.js (v18+)
- **UI Library**: Material-UI (MUI)
- **State Management**: React Context + Hooks
- **Routing**: React Router DOM
- **Forms**: Formik + Yup validation
- **HTTP Client**: Axios
- **Styling**: Emotion (CSS-in-JS)
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## 🚀 Quick Start

### Prerequisites
```bash
# Required software
Node.js (v20 or higher)
MongoDB (v6 or higher)
npm or yarn package manager
Git version control
```

### 🔧 Installation & Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/e-visa-application.git
cd e-visa-application
```

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
# nano .env  # or use your preferred editor

# Create admin user (optional)
node createAdmin.js

# Create visa types (optional)
node createVisaTypes.js

# Start development server
npm run dev
```

#### 3. Frontend Setup
```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file if needed
# nano .env

# Start development server
npm start
```

#### 4. Database Setup
```bash
# Make sure MongoDB is running
# Default connection: mongodb://localhost:27017/evisa

# The application will automatically create the database
# and collections on first run
```

## ⚙️ Environment Configuration

### Backend Environment Variables (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Connection
MONGODB_URI=mongodb://localhost:27017/evisa

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d


# Frontend URL
CLIENT_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # per window
```

### Frontend Environment Variables (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# Application Settings
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png
```


### Admin Endpoints

## 🔐 Security Features

### Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Role-based access control** (User, Admin)
- **Password hashing** using bcryptjs
- **Password reset** functionality

### Data Protection
- **Input validation** using express-validator
- **XSS protection** with helmet middleware
- **CORS configuration** for secure cross-origin requests
- **Rate limiting** to prevent abuse
- **File upload security** with type and size validation

### Database Security
- **MongoDB connection security** with authentication
- **Data sanitization** to prevent injection attacks
- **Mongoose schema validation** for data integrity

## 🎨 Frontend Architecture

### Component Structure
```
Components/
├── Auth/               # Authentication components
├── Common/             # Reusable UI components
├── Admin/              # Admin-specific components
├── User/               # User-specific components
└── Forms/              # Form components with validation
```

## 📈 Performance Optimization

### Backend Optimizations
- **Database indexing** on frequently queried fields
- **Pagination** for large dataset queries
- **Compression middleware** for response optimization
- **Image optimization** with Sharp
- **Caching strategies** for static data

### Frontend Optimizations
- **Code splitting** with React.lazy()
- **Image optimization** and lazy loading
- **Bundle optimization** with Create React App
- **Memoization** with React.memo and useMemo
- **Virtual scrolling** for large lists
