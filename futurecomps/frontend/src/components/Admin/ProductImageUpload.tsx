import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Plus, X } from 'lucide-react';

interface ProductImageUploadProps {
  initialImages: string[];
  onChange: (images: string[]) => void;
}

export function ProductImageUpload({
  initialImages,
  onChange,
}: ProductImageUploadProps) {
  const [images, setImages] = useState<string[]>(
    initialImages.length > 0 ? initialImages : ['']
  );

  const handleImageUploaded = (index: number, url: string) => {
    const newImages = [...images];
    newImages[index] = url;
    setImages(newImages);
    onChange(newImages.filter(img => img.trim()));
  };

  const addImageSlot = () => {
    setImages([...images, '']);
  };

  const removeImageSlot = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages.length > 0 ? newImages : ['']);
    onChange(newImages.filter(img => img.trim()));
  };

  return (
    <div className="space-y-4">
      {images.map((imageUrl, index) => (
        <div key={index} className="flex gap-2 items-start">
          <ImageUpload
            existingImageUrl={imageUrl}
            onImageUploaded={(url) => handleImageUploaded(index, url)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeImageSlot(index)}
            disabled={images.length === 1}
            className="flex-shrink-0 mt-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addImageSlot}
        className="mt-2 flex items-center gap-1"
      >
        <Plus className="h-4 w-4" /> Add Another Image
      </Button>
      
      <p className="text-xs text-muted-foreground mt-2">
        Images will be automatically optimized, resized, and converted to WebP format for better performance.
      </p>
    </div>
  );
}
