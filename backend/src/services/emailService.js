const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter (disabled)
  initializeTransporter() {
    console.log('Email service disabled');
    // Email service is disabled - no transporter needed
    this.transporter = null;
  }

  // Get email template
  async getEmailTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf8');

      // Replace variables in template
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, variables[key]);
      });

      return template;
    } catch (error) {
      console.error(`Failed to load email template ${templateName}:`, error);
      return this.getDefaultTemplate(templateName, variables);
    }
  }

  // Fallback templates if HTML files are not available
  getDefaultTemplate(templateName, variables) {
    const { firstName = 'User', applicationNumber = '', status = '', link = '', companyName = 'E-Visa System' } = variables;

    const templates = {
      'email-verification': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${companyName}!</h2>
          <p>Dear ${firstName},</p>
          <p>Thank you for registering with our E-Visa Application System. To complete your registration, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a>
          </div>
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account with us, please ignore this email.</p>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `,
      'welcome': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${companyName}!</h2>
          <p>Dear ${firstName},</p>
          <p>Your email has been successfully verified! Welcome to our E-Visa Application System.</p>
          <p>You can now:</p>
          <ul>
            <li>Create new visa applications</li>
            <li>Upload required documents</li>
            <li>Track your application status</li>
            <li>Receive real-time updates</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
          </div>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `,
      'password-reset': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Dear ${firstName},</p>
          <p>We received a request to reset your password for your ${companyName} account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>This reset link will expire in 10 minutes for security reasons.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `,
      'password-changed': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Changed Successfully</h2>
          <p>Dear ${firstName},</p>
          <p>Your password has been successfully changed for your ${companyName} account.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>For security reasons, please:</p>
          <ul>
            <li>Use a strong, unique password</li>
            <li>Don't share your login credentials</li>
            <li>Log out from shared devices</li>
          </ul>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `,
      'application-status': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Application Status Update</h2>
          <p>Dear ${firstName},</p>
          <p>Your visa application <strong>${applicationNumber}</strong> status has been updated.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>New Status:</strong> ${status}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/applications/${applicationNumber}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Application</a>
          </div>
          <p>You can log in to your account to view detailed information about your application.</p>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `,
      'document-verification': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Document Verification Update</h2>
          <p>Dear ${firstName},</p>
          <p>We have reviewed your documents for application <strong>${applicationNumber}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/applications/${applicationNumber}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details</a>
          </div>
          <p>Please log in to your account to see the verification status and any additional requirements.</p>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `,
      'account-deletion': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Deletion Confirmation</h2>
          <p>Dear ${firstName},</p>
          <p>Your ${companyName} account has been successfully deleted as requested.</p>
          <p>We're sorry to see you go. If you change your mind, you can always create a new account.</p>
          <p>Thank you for using our services.</p>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `
    };

    return templates[templateName] || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${companyName}</h2>
        <p>Dear ${firstName},</p>
        <p>This is a notification from ${companyName}.</p>
        <p>Best regards,<br>${companyName} Team</p>
      </div>
    `;
  }

  // Send email (disabled)
  async sendEmail(to, subject, html, attachments = []) {
    console.log(`Email sending disabled. Would have sent to: ${to}, Subject: ${subject}`);
    return { messageId: 'disabled', success: true };
  }

  // Send email verification
  async sendEmailVerification(email, token, firstName) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const html = await this.getEmailTemplate('email-verification', {
      firstName,
      link: verificationUrl,
      companyName: process.env.COMPANY_NAME || 'E-Visa System'
    });

    return this.sendEmail(
      email,
      'Verify Your Email Address',
      html
    );
  }

  // Send welcome email
  async sendWelcomeEmail(email, firstName) {
    const html = await this.getEmailTemplate('welcome', {
      firstName,
      companyName: process.env.COMPANY_NAME || 'E-Visa System'
    });

    return this.sendEmail(
      email,
      'Welcome to E-Visa System!',
      html
    );
  }

  // Send password reset email
  async sendPasswordReset(email, token, firstName) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const html = await this.getEmailTemplate('password-reset', {
      firstName,
      link: resetUrl,
      companyName: process.env.COMPANY_NAME || 'E-Visa System'
    });

    return this.sendEmail(
      email,
      'Reset Your Password',
      html
    );
  }

  // Send password change confirmation
  async sendPasswordChangeConfirmation(email, firstName) {
    const html = await this.getEmailTemplate('password-changed', {
      firstName,
      companyName: process.env.COMPANY_NAME || 'E-Visa System'
    });

    return this.sendEmail(
      email,
      'Password Changed Successfully',
      html
    );
  }

  // Send application status update
  async sendApplicationStatusUpdate(email, firstName, applicationNumber, status, notes = '') {
    const statusMessages = {
      'submitted': 'Your application has been submitted successfully.',
      'under_review': 'Your application is now under review.',
      'additional_docs_required': 'Additional documents are required for your application.',
      'interview_scheduled': 'An interview has been scheduled for your application.',
      'approved': 'Congratulations! Your application has been approved.',
      'rejected': 'Unfortunately, your application has been rejected.',
      'cancelled': 'Your application has been cancelled.'
    };

    const html = await this.getEmailTemplate('application-status', {
      firstName,
      applicationNumber,
      status: statusMessages[status] || status,
      notes,
      companyName: process.env.COMPANY_NAME || 'E-Visa System'
    });

    return this.sendEmail(
      email,
      `Application ${applicationNumber} - Status Update`,
      html
    );
  }

  // Send document verification update
  async sendDocumentVerificationUpdate(email, firstName, applicationNumber, documentType, verified) {
    const subject = verified ? 'Document Verified' : 'Document Verification Required';
    const message = verified 
      ? `Your ${documentType} document has been verified successfully.`
      : `Your ${documentType} document requires additional verification. Please check your application for details.`;

    const html = await this.getEmailTemplate('document-verification', {
      firstName,
      applicationNumber,
      message,
      companyName: process.env.COMPANY_NAME || 'E-Visa System'
    });

    return this.sendEmail(
      email,
      `${subject} - Application ${applicationNumber}`,
      html
    );
  }

  // Send interview notification
  async sendInterviewNotification(email, firstName, applicationNumber, interviewDate, location) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Interview Scheduled</h2>
        <p>Dear ${firstName},</p>
        <p>An interview has been scheduled for your visa application <strong>${applicationNumber}</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Date & Time:</strong> ${interviewDate}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <p>Please bring all required documents and arrive 15 minutes before your scheduled time.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/applications/${applicationNumber}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Application</a>
        </div>
        <p>Best regards,<br>${process.env.COMPANY_NAME || 'E-Visa System'} Team</p>
      </div>
    `;

    return this.sendEmail(
      email,
      `Interview Scheduled - Application ${applicationNumber}`,
      html
    );
  }

  // Send bulk notification
  async sendBulkNotification(recipients, subject, message) {
    const results = [];
    const batchSize = 10; // Send in batches to avoid rate limiting

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${process.env.COMPANY_NAME || 'E-Visa System'}</h2>
              <p>Dear ${recipient.firstName || 'User'},</p>
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                ${message}
              </div>
              <p>Best regards,<br>${process.env.COMPANY_NAME || 'E-Visa System'} Team</p>
            </div>
          `;

          await this.sendEmail(recipient.email, subject, html);
          return { email: recipient.email, status: 'sent' };
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          return { email: recipient.email, status: 'failed', error: error.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { status: 'failed' }
      ));

      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  // Send account deletion confirmation
  async sendAccountDeletionConfirmation(email, firstName) {
    const html = await this.getEmailTemplate('account-deletion', {
      firstName,
      companyName: process.env.COMPANY_NAME || 'E-Visa System'
    });

    return this.sendEmail(
      email,
      'Account Deletion Confirmation',
      html
    );
  }

  // Send system maintenance notification
  async sendMaintenanceNotification(email, firstName, maintenanceDate, duration) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Scheduled Maintenance Notification</h2>
        <p>Dear ${firstName},</p>
        <p>We will be performing scheduled maintenance on our E-Visa Application System.</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Maintenance Date:</strong> ${maintenanceDate}</p>
          <p><strong>Expected Duration:</strong> ${duration}</p>
        </div>
        <p>During this time, the system may be temporarily unavailable. We apologize for any inconvenience.</p>
        <p>Best regards,<br>${process.env.COMPANY_NAME || 'E-Visa System'} Team</p>
      </div>
    `;

    return this.sendEmail(
      email,
      'Scheduled System Maintenance',
      html
    );
  }
}

module.exports = new EmailService();
