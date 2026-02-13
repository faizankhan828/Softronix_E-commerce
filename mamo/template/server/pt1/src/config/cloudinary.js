const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mamo-store', // The folder in Cloudinary where images will be stored
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'], // Allowed image formats
    transformation: [
      { width: 1000, crop: 'limit' }, // Resize to max width of 1000px
      { quality: 'auto:good' }, // Automatic quality optimization
      { fetch_format: 'webp' }, // Convert to WebP format
    ],
  },
});

// Create Multer upload middleware
const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload,
};
