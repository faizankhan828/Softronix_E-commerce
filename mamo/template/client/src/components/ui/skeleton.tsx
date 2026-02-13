import { cn } from "../../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Product Card Skeleton
function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-gray-700">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 sm:p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </div>
      </div>
      <div className="p-3 sm:p-4 pt-0 flex space-x-2 border-t dark:border-gray-700">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

// Cart Item Skeleton
function CartItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border">
      <Skeleton className="h-20 w-20 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

// Table Row Skeleton
function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// Form Field Skeleton
function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// Page Header Skeleton
function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 mb-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export {
  Skeleton,
  ProductCardSkeleton,
  CartItemSkeleton,
  TableRowSkeleton,
  FormFieldSkeleton,
  PageHeaderSkeleton,
};
