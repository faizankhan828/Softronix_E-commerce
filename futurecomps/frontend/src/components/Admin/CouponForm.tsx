import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Loader2 } from "lucide-react";
import type { Coupon } from "@/api/services/couponService";
import productService from "@/api/services/productService";
// Product type is defined in the API service

interface CouponFormProps {
  initialData?: Coupon;
  onSubmit: (data: Partial<Coupon>) => Promise<void>;
  onCancel: () => void;
}

export default function CouponForm({
  initialData,
  onSubmit,
  onCancel,
}: CouponFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  // These state variables are used in the fetchProductsAndCategories function
  const [, setProducts] = useState<any[]>([]);
  const [, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState<Partial<Coupon>>(
    initialData || {
      code: "",
      description: "",
      type: "percentage",
      value: 0,
      minPurchase: 0,
      maxDiscount: null,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 30 days from now
      isActive: true,
      usageLimit: null,
      applicableProducts: [],
      excludedProducts: [],
      applicableCategories: [],
      userRestriction: [],
      oneTimePerUser: false,
    },
  );

  // Fetch products and categories
  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const productsData = await productService.getProducts({
          limit: 100,
          page: 1,
        });
        setProducts(productsData.products || []);

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(
            productsData.products
              .map((product) => product.category)
              .filter(Boolean),
          ),
        );
        setCategories(uniqueCategories as string[]);
      } catch (error) {
        console.error("Error fetching products and categories:", error);
        toast({
          title: "Error",
          description: "Failed to load products and categories",
          variant: "destructive",
        });
      }
    };

    fetchProductsAndCategories();
  }, [toast]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isNullable = false,
  ) => {
    const { name, value } = e.target;
    const numberValue = value === "" ? (isNullable ? null : 0) : Number(value);
    setFormData((prev) => ({ ...prev, [name]: numberValue }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting coupon form:", error);
      toast({
        title: "Error",
        description: "Failed to save coupon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code */}
        <div className="space-y-2">
          <Label htmlFor="code">Coupon Code *</Label>
          <Input
            id="code"
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            placeholder="SUMMER2023"
            required
            disabled={loading || (initialData?._id ? true : false)} // Disable editing code for existing coupons
            className="uppercase"
          />
          <p className="text-xs text-muted-foreground">
            Unique code for the coupon (uppercase)
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Summer Sale 2023"
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Brief description of the coupon
          </p>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Discount Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              handleSelectChange(
                "type",
                value as "percentage" | "fixed" | "shipping",
              )
            }
            disabled={loading}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select discount type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
              <SelectItem value="shipping">Free Shipping</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Type of discount to apply
          </p>
        </div>

        {/* Value */}
        <div className="space-y-2">
          <Label htmlFor="value">
            Discount Value *{" "}
            {formData.type === "percentage"
              ? "(%)"
              : formData.type === "fixed"
                ? "($)"
                : ""}
          </Label>
          <Input
            id="value"
            name="value"
            type="number"
            value={formData.value}
            onChange={(e) => handleNumberChange(e)}
            min={0}
            max={formData.type === "percentage" ? 100 : undefined}
            step={formData.type === "percentage" ? 1 : 0.01}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            {formData.type === "percentage"
              ? "Percentage discount (0-100)"
              : formData.type === "fixed"
                ? "Fixed amount discount"
                : "Shipping cost to deduct"}
          </p>
        </div>

        {/* Min Purchase */}
        <div className="space-y-2">
          <Label htmlFor="minPurchase">Minimum Purchase ($)</Label>
          <Input
            id="minPurchase"
            name="minPurchase"
            type="number"
            value={formData.minPurchase}
            onChange={(e) => handleNumberChange(e)}
            min={0}
            step={0.01}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Minimum cart value required (0 = no minimum)
          </p>
        </div>

        {/* Max Discount */}
        {formData.type === "percentage" && (
          <div className="space-y-2">
            <Label htmlFor="maxDiscount">Maximum Discount ($)</Label>
            <Input
              id="maxDiscount"
              name="maxDiscount"
              type="number"
              value={formData.maxDiscount === null ? "" : formData.maxDiscount}
              onChange={(e) => handleNumberChange(e, true)}
              min={0}
              step={0.01}
              disabled={loading}
              placeholder="No limit"
            />
            <p className="text-xs text-muted-foreground">
              Maximum discount amount (empty = no limit)
            </p>
          </div>
        )}

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={
              formData.startDate
                ? new Date(formData.startDate).toISOString().split("T")[0]
                : ""
            }
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            When the coupon becomes active
          </p>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="endDate">End Date *</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={
              formData.endDate
                ? new Date(formData.endDate).toISOString().split("T")[0]
                : ""
            }
            onChange={handleInputChange}
            required
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            When the coupon expires
          </p>
        </div>

        {/* Usage Limit */}
        <div className="space-y-2">
          <Label htmlFor="usageLimit">Usage Limit</Label>
          <Input
            id="usageLimit"
            name="usageLimit"
            type="number"
            value={formData.usageLimit === null ? "" : formData.usageLimit}
            onChange={(e) => handleNumberChange(e, true)}
            min={1}
            step={1}
            disabled={loading}
            placeholder="Unlimited"
          />
          <p className="text-xs text-muted-foreground">
            Maximum number of times this coupon can be used (empty = unlimited)
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-between space-x-2 pt-4">
          <Label htmlFor="isActive" className="flex-1">
            Active
          </Label>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              handleSwitchChange("isActive", checked)
            }
            disabled={loading}
          />
          <div className="w-1/2">
            <p className="text-xs text-muted-foreground">
              Whether the coupon is currently active
            </p>
          </div>
        </div>

        {/* One Time Per User */}
        <div className="flex items-center justify-between space-x-2 pt-4">
          <Label htmlFor="oneTimePerUser" className="flex-1">
            One-time per user
          </Label>
          <Switch
            id="oneTimePerUser"
            checked={formData.oneTimePerUser}
            onCheckedChange={(checked) =>
              handleSwitchChange("oneTimePerUser", checked)
            }
            disabled={loading}
          />
          <div className="w-1/2">
            <p className="text-xs text-muted-foreground">
              Each user can only use this coupon once
            </p>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>{initialData ? "Update" : "Create"} Coupon</>
          )}
        </Button>
      </div>
    </form>
  );
}
