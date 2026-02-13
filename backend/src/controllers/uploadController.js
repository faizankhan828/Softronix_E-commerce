import pkg from "@imagekit/nodejs";
const ImageKit = pkg.default || pkg;
import multer from "multer";
import path from "path";

// Lazy initialization of ImageKit
let imagekitInstance = null;

const getImageKit = () => {
  if (!imagekitInstance) {
    if (
      !process.env.IMAGEKIT_PRIVATE_KEY ||
      process.env.IMAGEKIT_PRIVATE_KEY === "your_imagekit_private_key_here"
    ) {
      throw new Error(
        "ImageKit is not configured. Please add IMAGEKIT_PRIVATE_KEY to .env file",
      );
    }

    imagekitInstance = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }

  return imagekitInstance;
};

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// @desc    Upload image to ImageKit
// @route   POST /api/upload/image
// @access  Private
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please provide an image file" });
    }

    // Get ImageKit instance (will throw error if not configured)
    const ik = getImageKit();

    const folder = req.body.folder || "/avatars";
    const fileName = `${Date.now()}_${req.file.originalname}`;

    // Upload to ImageKit using files.upload()
    const result = await ik.files.upload({
      file: req.file.buffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
    });

    res.json({
      message: "Image uploaded successfully",
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      size: result.size,
      filePath: result.filePath,
      thumbnailUrl: result.thumbnailUrl,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({
      message: error.message || "Failed to upload image",
    });
  }
};

// @desc    Get ImageKit authentication parameters for client-side upload
// @route   GET /api/upload/auth
// @access  Private
export const getAuthParameters = async (req, res) => {
  try {
    // Get ImageKit instance (will throw error if not configured)
    const ik = getImageKit();

    const authenticationParameters = ik.helper.getAuthenticationParameters();
    res.json(authenticationParameters);
  } catch (error) {
    console.error("Get auth parameters error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete image from ImageKit
// @route   DELETE /api/upload/:fileId
// @access  Private
export const deleteImage = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!fileId) {
      return res.status(400).json({ message: "File ID is required" });
    }

    // Get ImageKit instance (will throw error if not configured)
    const ik = getImageKit();

    await ik.files.delete(fileId);

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete image error:", error);
    res.status(500).json({
      message: error.message || "Failed to delete image",
    });
  }
};
