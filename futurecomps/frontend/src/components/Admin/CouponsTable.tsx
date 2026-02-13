import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Coupon } from "@/api/services/couponService";
import {
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";

interface CouponsTableProps {
  coupons: Coupon[];
  loading: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete: (couponId: string) => void;
  onAddNew: () => void;
  onRefresh?: () => void; // Optional refresh callback
}

export default function CouponsTable({
  coupons,
  loading,
  onEdit,
  onDelete,
  onAddNew,
  onRefresh,
}: CouponsTableProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  const handleDeleteClick = (couponId: string) => {
    setCouponToDelete(couponId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (couponToDelete) {
      onDelete(couponToDelete);
      setCouponToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (!coupon.isActive) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          Inactive
        </Badge>
      );
    } else if (now < startDate) {
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Scheduled
        </Badge>
      );
    } else if (now > endDate) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
          Expired
        </Badge>
      );
    } else if (
      coupon.usageLimit !== null &&
      coupon.usageCount >= coupon.usageLimit
    ) {
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800">
          Exhausted
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Active
        </Badge>
      );
    }
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.type === "percentage") {
      return `${coupon.value}%`;
    } else if (coupon.type === "fixed") {
      return `$${coupon.value.toFixed(2)}`;
    } else if (coupon.type === "shipping") {
      return "Free Shipping";
    }
    return "";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <div className="flex space-x-2">
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              title="Refresh coupon data"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Coupon
          </Button>
        </div>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-8 text-center">
          <p className="text-muted-foreground mb-4">No coupons found</p>
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Coupon
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon._id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>{coupon.description}</TableCell>
                  <TableCell>
                    {getDiscountText(coupon)}
                    {coupon.minPurchase > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Min: ${coupon.minPurchase.toFixed(2)}
                      </div>
                    )}
                    {coupon.type === "percentage" &&
                      coupon.maxDiscount !== null && (
                        <div className="text-xs text-muted-foreground">
                          Max: ${coupon.maxDiscount.toFixed(2)}
                        </div>
                      )}
                  </TableCell>
                  <TableCell>
                    {formatDate(coupon.startDate)} -{" "}
                    {formatDate(coupon.endDate)}
                  </TableCell>
                  <TableCell>
                    {coupon.usageCount} / {coupon.usageLimit || "∞"}
                  </TableCell>
                  <TableCell>{getStatusBadge(coupon)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(coupon)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteClick(coupon._id!)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this coupon. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
