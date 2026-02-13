import { useState, useRef } from "react";
import { Button } from "./Button";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { IKContext, IKUpload } from "imagekitio-react";
import { uploadAPI } from "../../services/api";

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  existingImageUrl?: string;
  className?: string;
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

export function ImageUpload({
  onImageUploaded,
  existingImageUrl,
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingImageUrl || null,
  );
  const [error, setError] = useState<string | null>(null);
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
    setIsUploading(false);
    setPreviewUrl(existingImageUrl || null);
  };

  const onSuccess = (res: any) => {
    console.log("Upload successful:", res);
    setPreviewUrl(res.url);
    setUploadProgress(100);
    setIsUploading(false);
    onImageUploaded(res.url);
  };

  const onUploadStart = () => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
  };

  const onUploadProgress = (evt: any) => {
    const progress = Math.round((evt.loaded / evt.total) * 100);
    setUploadProgress(progress);
  };

  const handleButtonClick = () => {
    const input = ikUploadRef.current;
    if (input) {
      input.click();
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded("");
  };

  return (
    <IKContext
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
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
                  Uploading... {uploadProgress}%
                </p>
                {uploadProgress > 0 && (
                  <div className="w-full max-w-xs">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-gray-400 dark:text-gray-600 mb-2" />
                <p className="text-sm font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  JPG, PNG, GIF, WebP (max 5MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleButtonClick}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
              </>
            )}
          </div>
        )}

        {/* Hidden ImageKit Upload Component */}
        <IKUpload
          fileName={`${Date.now()}.jpg`}
          folder="/products"
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
                setPreviewUrl(reader.result as string);
              };
              reader.readAsDataURL(file);
            }
            return valid;
          }}
        />

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>
    </IKContext>
  );
}
