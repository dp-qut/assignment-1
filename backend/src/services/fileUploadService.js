const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure AWS S3 (if using AWS)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

class FileUploadService {
  // Upload file to S3
  async uploadToS3(file) {
    try {
      if (!process.env.AWS_ACCESS_KEY_ID) {
        // If AWS not configured, use local storage
        return await this.uploadToLocal(file);
      }

      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `uploads/${Date.now()}-${file.originalname}`,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
        ACL: 'private' // Files are private by default
      };

      const result = await s3.upload(params).promise();
      
      // Delete local file after upload
      fs.unlinkSync(file.path);
      
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      // Fallback to local storage
      return await this.uploadToLocal(file);
    }
  }

  // Upload file to local storage
  uploadToLocal(file) {
    try {
      const filename = `${Date.now()}-${file.originalname}`;
      const localPath = path.join(__dirname, '../../uploads', filename);
      
      // If file is already in uploads directory, just return the URL
      if (file.path.includes('uploads')) {
        return `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${path.basename(file.path)}`;
      }
      
      // Move file to uploads directory
      fs.renameSync(file.path, localPath);
      
      return `${process.env.SERVER_URL || 'http://localhost:5000'}/uploads/${filename}`;
    } catch (error) {
      console.error('Local upload error:', error);
      throw new Error('Failed to upload file');
    }
  }

  // Delete file from S3
  async deleteFromS3(fileUrl) {
    try {
      if (!process.env.AWS_ACCESS_KEY_ID || !fileUrl.includes('amazonaws.com')) {
        // If AWS not configured or local file, delete locally
        return this.deleteFromLocal(fileUrl);
      }

      const key = fileUrl.split('/').slice(-2).join('/'); // Extract key from URL
      
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
      };

      await s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('S3 delete error:', error);
      return this.deleteFromLocal(fileUrl);
    }
  }

  // Delete file from local storage
  deleteFromLocal(fileUrl) {
    try {
      const filename = path.basename(fileUrl);
      const localPath = path.join(__dirname, '../../uploads', filename);
      
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Local delete error:', error);
      return false;
    }
  }

  // Get file from S3 (generate signed URL)
  async getSignedUrl(fileUrl, expiresIn = 3600) {
    try {
      if (!process.env.AWS_ACCESS_KEY_ID || !fileUrl.includes('amazonaws.com')) {
        // If local file, return as is
        return fileUrl;
      }

      const key = fileUrl.split('/').slice(-2).join('/');
      
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: expiresIn
      };

      return s3.getSignedUrl('getObject', params);
    } catch (error) {
      console.error('Signed URL error:', error);
      return fileUrl;
    }
  }

  // Validate file type
  validateFileType(file, allowedTypes = []) {
    if (allowedTypes.length === 0) {
      // Default allowed types
      allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'doc', 'docx'];
    }

    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    return allowedTypes.includes(fileExtension);
  }

  // Validate file size
  validateFileSize(file, maxSizeInMB = 5) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  // Get file info
  getFileInfo(file) {
    return {
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      extension: path.extname(file.originalname).toLowerCase(),
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  }

  // Process image (resize, compress) - requires sharp package
  async processImage(file, options = {}) {
    try {
      const sharp = require('sharp');
      
      const {
        width = 800,
        height = 600,
        quality = 80,
        format = 'jpeg'
      } = options;

      const processedBuffer = await sharp(file.path)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toBuffer();

      // Create processed file
      const processedPath = file.path.replace(path.extname(file.path), `_processed.${format}`);
      fs.writeFileSync(processedPath, processedBuffer);

      return {
        ...file,
        path: processedPath,
        size: processedBuffer.length
      };
    } catch (error) {
      console.error('Image processing error:', error);
      // Return original file if processing fails
      return file;
    }
  }

  // Generate thumbnail
  async generateThumbnail(file, options = {}) {
    try {
      const sharp = require('sharp');
      
      const {
        width = 150,
        height = 150,
        quality = 70
      } = options;

      const thumbnailBuffer = await sharp(file.path)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality })
        .toBuffer();

      const thumbnailPath = file.path.replace(path.extname(file.path), '_thumb.jpg');
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);

      return thumbnailPath;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      return null;
    }
  }

  // Cleanup old files
  async cleanupOldFiles(daysOld = 30) {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads');
      const files = fs.readdirSync(uploadsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old files`);
      return deletedCount;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }
}

module.exports = new FileUploadService();
