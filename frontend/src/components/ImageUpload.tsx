import { useState, useRef } from "react";
import { IKContext, IKUpload } from "imagekitio-react";
import { uploadAPI } from "../services/api";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: any) => void;
  currentImage?: string;
  folder?: string;
}

const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT;
const authenticator = async () => {
  try {
    const response = await uploadAPI.getAuthParameters();
    const { token, expire, signature } = response.data;
    return { token, expire, signature };
  } catch (error) {
    throw new Error("Failed to get authentication parameters");
  }
};

export default function ImageUpload({
  onUploadSuccess,
  onUploadError,
  currentImage,
  folder = "/avatars",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const ikUploadRef = useRef<any>(null);

  const validateFile = (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPG, PNG, GIF, or WebP)");
      return false;
    }

    if (file.size > maxSize) {
      setError("Image size should be less than 5MB");
      return false;
    }

    return true;
  };

  const onError = (err: any) => {
    console.error("Image upload error:", err);
    setError(err.message || "Failed to upload image");
    setUploading(false);
    setPreview(currentImage);

    if (onUploadError) {
      onUploadError(err);
    }
  };

  const onSuccess = (res: any) => {
    console.log("Upload successful:", res);
    setPreview(res.url);
    setUploadProgress(100);
    setUploading(false);
    onUploadSuccess(res.url);
  };

  const onUploadStart = () => {
    setUploading(true);
    setError("");
    setUploadProgress(0);
  };

  const onUploadProgress = (evt: any) => {
    const progress = Math.round((evt.loaded / evt.total) * 100);
    setUploadProgress(progress);
  };

  const handleButtonClick = () => {
    // Trigger the hidden file input
    const input = ikUploadRef.current;
    if (input) {
      input.click();
    }
  };

  return (
    <IKContext
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Preview */}
          {preview && (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          )}

          {!preview && !uploading && (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="w-full max-w-xs">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading
              ? "Uploading..."
              : preview
                ? "Change Image"
                : "Upload Image"}
          </button>

          {/* Hidden ImageKit Upload Component */}
          <IKUpload
            fileName={`${Date.now()}.jpg`}
            folder={folder}
            useUniqueFileName={true}
            onError={onError}
            onSuccess={onSuccess}
            onUploadStart={onUploadStart}
            onUploadProgress={onUploadProgress}
            ref={ikUploadRef}
            style={{ display: "none" }}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            validateFile={(file: File) => {
              const valid = validateFile(file);
              if (valid) {
                // Show preview immediately
                const reader = new FileReader();
                reader.onloadend = () => {
                  setPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
              return valid;
            }}
          />

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Helper Text */}
          <p className="text-xs text-gray-500 text-center">
            Max size: 5MB. Formats: JPG, PNG, GIF, WebP
            <br />
            <span className="text-green-600 font-medium">
              ✓ Direct upload to CDN (faster, saves server resources)
            </span>
          </p>
        </div>
      </div>
    </IKContext>
  );
}
