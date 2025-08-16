const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./src/models/User');

// Admin user credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@evisa.com',
  password: 'admin123',
  role: 'admin',
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    nationality: 'System',
    dateOfBirth: new Date('1990-01-01'),
    phone: '+1234567890'
  },
  emailVerified: true,
  isActive: true
};

const createAdminUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', ADMIN_CREDENTIALS.email);
      console.log('Password: admin123');
      return;
    }

    // Create admin user
    const adminUser = new User(ADMIN_CREDENTIALS);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', ADMIN_CREDENTIALS.email);
    console.log('🔐 Password:', ADMIN_CREDENTIALS.password);
    console.log('');
    console.log('You can now login to the admin dashboard with these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the script
createAdminUser();
