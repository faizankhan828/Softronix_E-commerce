import {
  ShoppingBag,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

interface DashboardHeaderProps {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders?: number;
    lowStockProducts?: number;
  };
  trends?: {
    revenue?: { value: number; isPositive: boolean };
    orders?: { value: number; isPositive: boolean };
    customers?: { value: number; isPositive: boolean };
    products?: { value: number; isPositive: boolean };
  };
  isLoading?: boolean;
  onRefresh?: () => void;
}

function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading: propIsLoading,
}: StatCardProps & { isLoading?: boolean }) {
  const isLoading = propIsLoading || value === undefined;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          )}

          {!isLoading && trend && (
            <div className="flex items-center mt-1">
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-4 w-32 mt-2" />
          ) : (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-full">
          {isLoading ? (
            <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardHeader({
  stats,
  trends,
  isLoading,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of your store's performance and analytics
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={isLoading ? 0 : `$${stats.totalRevenue.toLocaleString()}`}
          description="Total revenue across all orders"
          icon={<CreditCard className="h-6 w-6 text-primary" />}
          trend={trends?.revenue}
        />
        <StatCard
          title="Orders"
          value={isLoading ? 0 : stats.totalOrders}
          description="Total number of orders"
          icon={<ShoppingBag className="h-6 w-6 text-primary" />}
          trend={trends?.orders}
        />
        <StatCard
          title="Customers"
          value={isLoading ? 0 : stats.totalCustomers}
          description="Total registered customers"
          icon={<Users className="h-6 w-6 text-primary" />}
          trend={trends?.customers}
        />
        <StatCard
          title="Products"
          value={isLoading ? 0 : stats.totalProducts}
          description="Products in your inventory"
          icon={<Package className="h-6 w-6 text-primary" />}
          trend={trends?.products}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Pending Orders"
          value={isLoading ? 0 : stats.pendingOrders || 0}
          description="Orders awaiting processing"
          icon={<Clock className="h-6 w-6 text-amber-500" />}
        />
        <StatCard
          title="Low Stock Products"
          value={isLoading ? 0 : stats.lowStockProducts || 0}
          description="Products with low inventory"
          icon={<AlertCircle className="h-6 w-6 text-red-500" />}
        />
        <StatCard
          title="Active Products"
          value={
            isLoading ? 0 : stats.totalProducts - (stats.lowStockProducts || 0)
          }
          description="Products with sufficient inventory"
          icon={<CheckCircle2 className="h-6 w-6 text-green-500" />}
        />
      </div>
    </div>
  );
}
