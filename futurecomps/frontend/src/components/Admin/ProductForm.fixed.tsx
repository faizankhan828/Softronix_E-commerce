import { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Textarea } from "../../components/ui/Textarea";
import { Switch } from "../../components/ui/Switch";
// import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import {
  X,
  Plus,
  Tag,
  Image,
  Palette,
  Ruler,
  Info,
  DollarSign,
  Package,
  Bookmark,
  Barcode,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";

interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: string[];
  inventory?: number;
  colors: string[];
  sizes: string[];
  inStock: boolean;
  discountedPrice?: number;
  taxRate?: number;
  taxIncluded?: boolean;
  tags?: string[];
  isNew: boolean;
  isFeatured: boolean;
  sku?: string;
}

interface ProductFormProps {
  initialData: Partial<Product>;
  onSubmit: (product: Partial<Product>) => void;
  onCancel: () => void;
}

// Common product categories
const categories = [
  "Clothing",
  "Shoes",
  "Accessories",
  "Electronics",
  "Home & Kitchen",
  "Beauty",
  "Sports",
  "Books",
  "Toys",
  "Other",
];

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [formData, setFormData] = useState<Partial<Product>>(initialData);
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialData.images && initialData.images.length > 0
      ? initialData.images
      : [""],
  );
  const [colors, setColors] = useState<string[]>(
    initialData.colors || ["Black", "White"],
  );
  const [sizes, setSizes] = useState<string[]>(
    initialData.sizes || ["S", "M", "L"],
  );
  const [tags, setTags] = useState<string[]>(initialData.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Reset form state when initialData changes (e.g., when dialog reopens)
  useEffect(() => {
    setFormData(initialData);
    setImageUrls(
      initialData.images && initialData.images.length > 0
        ? initialData.images
        : [""],
    );
    setColors(initialData.colors || ["Black", "White"]);
    setSizes(initialData.sizes || ["S", "M", "L"]);
    setTags(initialData.tags || []);
    setTagInput("");
  }, [initialData]);

  // Handle basic form inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle switch toggle
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  // Handle image URL updates
  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
    setFormData({ ...formData, images: newUrls.filter((url) => url.trim()) });
  };

  // Add a new image URL input
  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  // Remove an image URL input
  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls);
    setFormData({ ...formData, images: newUrls.filter((url) => url.trim()) });
  };

  // Handle color updates
  const handleColorChange = (index: number, value: string) => {
    const newColors = [...colors];
    newColors[index] = value;
    setColors(newColors);
    setFormData({ ...formData, colors: newColors.filter((c) => c.trim()) });
  };

  // Add a new color input
  const addColor = () => {
    setColors([...colors, ""]);
  };

  // Remove a color input
  const removeColor = (index: number) => {
    const newColors = colors.filter((_, i) => i !== index);
    setColors(newColors);
    setFormData({ ...formData, colors: newColors.filter((c) => c.trim()) });
  };

  // Handle size updates
  const handleSizeChange = (index: number, value: string) => {
    const newSizes = [...sizes];
    newSizes[index] = value;
    setSizes(newSizes);
    setFormData({ ...formData, sizes: newSizes.filter((s) => s.trim()) });
  };

  // Add a new size input
  const addSize = () => {
    setSizes([...sizes, ""]);
  };

  // Remove a size input
  const removeSize = (index: number) => {
    const newSizes = sizes.filter((_, i) => i !== index);
    setSizes(newSizes);
    setFormData({ ...formData, sizes: newSizes.filter((s) => s.trim()) });
  };

  // Handle tag input
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  // Add a tag when Enter is pressed
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        const newTags = [...tags, tagInput.trim()];
        setTags(newTags);
        setFormData({ ...formData, tags: newTags });
      }
      setTagInput("");
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    setFormData({ ...formData, tags: newTags });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty arrays and prepare the final data
    const finalData = {
      ...formData,
      images: imageUrls.filter((url) => url.trim()),
      colors: colors.filter((color) => color.trim()),
      sizes: sizes.filter((size) => size.trim()),
      tags: tags.filter((tag) => tag.trim()),
    };

    // Call the onSubmit prop with the form data
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="overflow-hidden">
        <div className="bg-primary-50 dark:bg-primary-950 p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Basic Information
          </h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-full overflow-x-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  <Bookmark className="h-4 w-4" /> Product Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  required
                  className="focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center gap-1">
                  <Package className="h-4 w-4" /> Category
                </Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="focus-visible:ring-primary">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Price ($)
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price || ""}
                    onChange={handleInputChange}
                    required
                    className="focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="discountedPrice"
                    className="flex items-center gap-1"
                  >
                    <DollarSign className="h-4 w-4" /> Discount Price ($)
                  </Label>
                  <Input
                    id="discountedPrice"
                    name="discountedPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountedPrice || ""}
                    onChange={handleInputChange}
                    className="focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" /> Tax Rate (%)
                  </Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.taxRate || ""}
                    onChange={handleInputChange}
                    className="focus-visible:ring-primary"
                    placeholder="e.g. 8.5 for 8.5%"
                  />
                </div>

                <div className="flex flex-col space-y-2 bg-primary-50 dark:bg-primary-950 p-3 rounded-md mt-8">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="taxIncluded"
                      checked={formData.taxIncluded || false}
                      onCheckedChange={(checked) =>
                        handleSwitchChange("taxIncluded", checked)
                      }
                    />
                    <Label htmlFor="taxIncluded">Tax Included in Price</Label>
                  </div>
                  {formData.taxIncluded &&
                    formData.price &&
                    formData.taxRate && (
                      <div className="text-xs text-muted-foreground mt-1 pl-8">
                        <div>
                          Price without tax: $
                          {(
                            formData.price /
                            (1 + formData.taxRate / 100)
                          ).toFixed(2)}
                        </div>
                        <div>
                          Tax amount: $
                          {(
                            formData.price -
                            formData.price / (1 + formData.taxRate / 100)
                          ).toFixed(2)}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku" className="flex items-center gap-1">
                  <Barcode className="h-4 w-4" /> SKU
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku || ""}
                  onChange={handleInputChange}
                  className="focus-visible:ring-primary"
                  placeholder="Product SKU or ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inventory" className="flex items-center gap-1">
                  <Package className="h-4 w-4" /> Inventory
                </Label>
                <Input
                  id="inventory"
                  name="inventory"
                  type="number"
                  min="0"
                  value={formData.inventory || ""}
                  onChange={handleInputChange}
                  className="focus-visible:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="flex items-center gap-1"
                >
                  <Info className="h-4 w-4" /> Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  required
                  className="resize-none focus-visible:ring-primary min-h-[120px]"
                  placeholder="Enter detailed product description here..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center space-x-2 bg-primary-50 dark:bg-primary-950 p-3 rounded-md">
                  <Switch
                    id="inStock"
                    checked={formData.inStock}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("inStock", checked)
                    }
                  />
                  <Label htmlFor="inStock">In Stock</Label>
                </div>

                <div className="flex items-center space-x-2 bg-primary-50 dark:bg-primary-950 p-3 rounded-md">
                  <Switch
                    id="isNew"
                    checked={formData.isNew}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isNew", checked)
                    }
                  />
                  <Label htmlFor="isNew">Mark as New</Label>
                </div>

                <div className="flex items-center space-x-2 bg-primary-50 dark:bg-primary-950 p-3 rounded-md">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isFeatured", checked)
                    }
                  />
                  <Label htmlFor="isFeatured">Featured</Label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="bg-primary-50 dark:bg-primary-950 p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Product Images
          </h3>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            {imageUrls.map((url, index) => (
              <div key={index} className="flex gap-2 items-center">
                {url && (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                    <img
                      src={url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml;charset=UTF-8,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='4' text-anchor='middle' alignment-baseline='middle' font-family='Arial, sans-serif' fill='%23999999'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                )}
                <Input
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="Image URL"
                  className="flex-1 focus-visible:ring-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeImageUrl(index)}
                  disabled={imageUrls.length === 1}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addImageUrl}
              className="mt-2 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Image URL
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="bg-primary-50 dark:bg-primary-950 p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Available Colors
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-3">
              {colors.map((color, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                  <Input
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    placeholder="Color name"
                    className="flex-1 focus-visible:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeColor(index)}
                    disabled={colors.length === 1}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addColor}
                className="mt-2 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Color
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-primary-50 dark:bg-primary-950 p-4 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              Available Sizes
            </h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-3">
              {sizes.map((size, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-md border flex items-center justify-center bg-muted font-medium">
                    {size}
                  </div>
                  <Input
                    value={size}
                    onChange={(e) => handleSizeChange(index, e.target.value)}
                    placeholder="Size"
                    className="flex-1 focus-visible:ring-primary"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeSize(index)}
                    disabled={sizes.length === 1}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSize}
                className="mt-2 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Size
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-primary-50 dark:bg-primary-950 p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Product Tags
          </h3>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.length > 0 ? (
                tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 flex items-center gap-1 text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground ml-1"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">
                  No tags added yet
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                id="tagInput"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags (press Enter)"
                className="flex-1 focus-visible:ring-primary"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (tagInput.trim()) {
                    if (!tags.includes(tagInput.trim())) {
                      const newTags = [...tags, tagInput.trim()];
                      setTags(newTags);
                      setFormData({ ...formData, tags: newTags });
                    }
                    setTagInput("");
                  }
                }}
                className="flex-shrink-0 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full sm:w-auto min-w-[100px] bg-primary hover:bg-primary/90"
        >
          Save Product
        </Button>
      </div>
    </form>
  );
}
