import { cloudName, uploadPreset } from "../config/cloudinary";
import imageCompression from "browser-image-compression";

/**
 * Applies Cloudinary transformations to an image URL
 * @param url The original Cloudinary URL
 * @returns The URL with transformations applied
 */
const applyCloudinaryTransformations = (url: string): string => {
  // Check if the URL is a Cloudinary URL
  if (!url.includes("cloudinary.com")) {
    return url;
  }

  // Parse the URL to find the upload part
  const uploadIndex = url.indexOf("/upload/");
  if (uploadIndex === -1) {
    return url;
  }

  // Insert transformations after /upload/
  const transformations = "c_limit,w_1000,q_auto:good,f_webp";
  const transformedUrl =
    url.slice(0, uploadIndex + 8) + // +8 to include '/upload/'
    transformations +
    "/" +
    url.slice(uploadIndex + 8); // The rest of the URL

  return transformedUrl;
};

/**
 * Compresses an image file before uploading
 * @param file The image file to compress
 * @returns A compressed image file
 */
const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 1, // Max file size in MB
    maxWidthOrHeight: 1920, // Max width/height in pixels
    useWebWorker: true, // Use web worker for better performance
    fileType: "image/webp", // Convert to WebP format
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Error compressing image:", error);
    return file; // Return original file if compression fails
  }
};

/**
 * Uploads an image to Cloudinary
 * @param file The image file to upload
 * @returns The Cloudinary URL of the uploaded image
 */
const uploadImage = async (file: File): Promise<string> => {
  try {
    console.log("Starting image upload process...");
    console.log("Cloudinary config:", { cloudName, uploadPreset });

    // Compress the image before uploading
    const compressedFile = await compressImage(file);
    console.log("Image compressed successfully");

    // Create form data for the upload
    const formData = new FormData();
    formData.append("file", compressedFile);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "mamo-store");

    // Note: Transformations should be configured in the upload preset on Cloudinary's side
    // We can't specify them directly here with unsigned uploads

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log("Uploading to:", uploadUrl);

    // Upload to Cloudinary
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error(
        "Cloudinary response not OK:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(
        `Upload failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Cloudinary response:", data);

    if (data.secure_url) {
      console.log("Upload successful, URL:", data.secure_url);

      // Apply transformations to the URL after upload
      // This works even if the upload preset doesn't have transformations configured
      const transformedUrl = applyCloudinaryTransformations(data.secure_url);
      console.log("Transformed URL:", transformedUrl);

      return transformedUrl;
    } else {
      console.error("No secure_url in response:", data);
      throw new Error("Failed to get image URL from Cloudinary");
    }
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};

export { uploadImage, compressImage };
