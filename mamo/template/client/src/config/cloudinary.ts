import { Cloudinary } from "@cloudinary/url-gen";

// Get Cloudinary configuration from environment variables
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Create a Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: cloudName,
  },
  url: {
    secure: true, // Use HTTPS
  },
});

// Export Cloudinary configuration
export { cld, cloudName, uploadPreset };
