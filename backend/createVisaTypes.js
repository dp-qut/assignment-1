const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const VisaType = require('./src/models/VisaType');
const User = require('./src/models/User');

const createVisaTypes = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find an admin user to be the creator
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found, creating one...');
      adminUser = new User({
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
      });
      await adminUser.save();
    }

    const sampleVisaTypes = [
      {
        name: 'Tourist Visa',
        code: 'TOURIST',
        description: 'For leisure and tourism purposes',
        category: 'tourist',
        duration: {
          maxStayDays: 90,
          validityPeriod: 180,
          entries: 'multiple'
        },
        processing: {
          standardDays: 10,
          urgentDays: 5,
          expressDays: 3
        },
        fees: {
          standard: {
            amount: 50,
            currency: 'USD'
          },
          urgent: {
            amount: 100,
            currency: 'USD'
          },
          express: {
            amount: 150,
            currency: 'USD'
          }
        },
        eligibility: {
          requirements: [
            {
              requirement: 'Valid passport with at least 6 months validity',
              description: 'Passport must be valid for at least 6 months from date of entry',
              isMandatory: true
            },
            {
              requirement: 'Sufficient funds for the trip',
              description: 'Bank statements showing adequate financial resources',
              isMandatory: true
            }
          ]
        },
        requiredDocuments: [
          {
            type: 'passport_copy',
            name: 'Passport Copy',
            description: 'Clear copy of passport information page',
            isMandatory: true,
            formats: ['PDF', 'JPG', 'JPEG', 'PNG'],
            maxSizeMB: 5
          },
          {
            type: 'photo',
            name: 'Passport Photo',
            description: 'Recent passport-size photograph',
            isMandatory: true,
            formats: ['JPG', 'JPEG', 'PNG'],
            maxSizeMB: 2
          },
          {
            type: 'bank_statement',
            name: 'Bank Statement',
            description: 'Bank statements for last 3 months',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 5
          },
          {
            type: 'flight_itinerary',
            name: 'Flight Itinerary',
            description: 'Round-trip flight reservation',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 3
          },
          {
            type: 'hotel_booking',
            name: 'Hotel Booking',
            description: 'Hotel reservations or accommodation proof',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 3
          }
        ],
        settings: {
          isActive: true,
          isPublic: true
        },
        createdBy: adminUser._id
      },
      {
        name: 'Business Visa',
        code: 'BUSINESS',
        description: 'For business meetings, conferences, and commercial activities',
        category: 'business',
        duration: {
          maxStayDays: 90,
          validityPeriod: 365,
          entries: 'multiple'
        },
        processing: {
          standardDays: 15,
          urgentDays: 7,
          expressDays: 5
        },
        fees: {
          standard: {
            amount: 150,
            currency: 'USD'
          },
          urgent: {
            amount: 250,
            currency: 'USD'
          },
          express: {
            amount: 350,
            currency: 'USD'
          }
        },
        eligibility: {
          requirements: [
            {
              requirement: 'Valid passport with at least 6 months validity',
              description: 'Passport must be valid for at least 6 months from date of entry',
              isMandatory: true
            },
            {
              requirement: 'Business invitation letter',
              description: 'Letter from host company or organization',
              isMandatory: true
            }
          ]
        },
        requiredDocuments: [
          {
            type: 'passport_copy',
            name: 'Passport Copy',
            description: 'Clear copy of passport information page',
            isMandatory: true,
            formats: ['PDF', 'JPG', 'JPEG', 'PNG'],
            maxSizeMB: 5
          },
          {
            type: 'photo',
            name: 'Passport Photo',
            description: 'Recent passport-size photograph',
            isMandatory: true,
            formats: ['JPG', 'JPEG', 'PNG'],
            maxSizeMB: 2
          },
          {
            type: 'bank_statement',
            name: 'Bank Statement',
            description: 'Bank statements for last 6 months',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 5
          },
          {
            type: 'invitation_letter',
            name: 'Business Invitation Letter',
            description: 'Letter from host company or organization',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 3
          },
          {
            type: 'employment_letter',
            name: 'Employment Letter',
            description: 'Letter from employer confirming employment',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 3
          }
        ],
        settings: {
          isActive: true,
          isPublic: true
        },
        createdBy: adminUser._id
      },
      {
        name: 'Student Visa',
        code: 'STUDENT',
        description: 'For educational purposes and study programs',
        category: 'student',
        duration: {
          maxStayDays: 365,
          validityPeriod: 365,
          entries: 'multiple'
        },
        processing: {
          standardDays: 20,
          urgentDays: 10,
          expressDays: 7
        },
        fees: {
          standard: {
            amount: 200,
            currency: 'USD'
          },
          urgent: {
            amount: 350,
            currency: 'USD'
          },
          express: {
            amount: 500,
            currency: 'USD'
          }
        },
        eligibility: {
          requirements: [
            {
              requirement: 'Valid passport with at least 6 months validity',
              description: 'Passport must be valid for at least 6 months from date of entry',
              isMandatory: true
            },
            {
              requirement: 'Letter of acceptance from educational institution',
              description: 'Official acceptance letter from recognized educational institution',
              isMandatory: true
            }
          ]
        },
        requiredDocuments: [
          {
            type: 'passport_copy',
            name: 'Passport Copy',
            description: 'Clear copy of passport information page',
            isMandatory: true,
            formats: ['PDF', 'JPG', 'JPEG', 'PNG'],
            maxSizeMB: 5
          },
          {
            type: 'photo',
            name: 'Passport Photo',
            description: 'Recent passport-size photograph',
            isMandatory: true,
            formats: ['JPG', 'JPEG', 'PNG'],
            maxSizeMB: 2
          },
          {
            type: 'bank_statement',
            name: 'Bank Statement',
            description: 'Bank statements showing adequate funds for studies',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 5
          },
          {
            type: 'academic_transcript',
            name: 'Academic Transcripts',
            description: 'Educational certificates and transcripts',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 5
          },
          {
            type: 'medical_certificate',
            name: 'Medical Certificate',
            description: 'Health examination report',
            isMandatory: true,
            formats: ['PDF'],
            maxSizeMB: 3
          }
        ],
        settings: {
          isActive: true,
          isPublic: true
        },
        createdBy: adminUser._id
      }
    ];

    // Clear existing visa types
    await VisaType.deleteMany({});
    console.log('Cleared existing visa types');

    // Create new visa types
    const createdVisaTypes = await VisaType.insertMany(sampleVisaTypes);
    
    console.log('✅ Sample visa types created successfully!');
    console.log(`Created ${createdVisaTypes.length} visa types:`);
    
    createdVisaTypes.forEach(visaType => {
      console.log(`- ${visaType.name} (${visaType.code})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating visa types:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run the script
createVisaTypes();
