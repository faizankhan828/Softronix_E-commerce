import { useState } from "react";
import { Button } from "./button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadImage } from "../../services/cloudinaryService";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  existingImageUrl?: string;
  className?: string;
}

export function ImageUpload({
  onImageUploaded,
  existingImageUrl,
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingImageUrl || null
  );
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {

      // Create a local preview
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadImage(file);

        // Call the callback with the Cloudinary URL
        onImageUploaded(cloudinaryUrl);

        // Clean up local preview URL
        URL.revokeObjectURL(localPreview);

        // Set the preview to the Cloudinary URL
        setPreviewUrl(cloudinaryUrl);
      } catch (uploadErr) {
        console.error("Upload to Cloudinary failed:", uploadErr);

        // Keep the local preview if Cloudinary upload fails
        onImageUploaded(localPreview);
        setError(
          `Failed to upload to Cloudinary: ${
            uploadErr instanceof Error ? uploadErr.message : String(uploadErr)
          }. Using local preview instead.`
        );
      }
    } catch (err) {
      console.error("Upload process failed:", err);
      setError(
        `Failed to process image: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded("");
  };

  return (
    <div className={`relative ${className}`}>
      {previewUrl ? (
        <div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full h-8 w-8"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-md p-6 flex flex-col items-center justify-center text-center">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Optimizing and uploading...
              </p>
            </div>
          ) : (
            <>
              <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium mb-1">
                Drag and drop or click to upload
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Images will be optimized and converted to WebP format
              </p>
              <Button type="button" variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Select Image
              </Button>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept="image/*"
              />
            </>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
