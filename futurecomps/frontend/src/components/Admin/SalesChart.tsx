import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";

interface SalesData {
  date: string;
  amount: number;
}

interface SalesChartProps {
  salesData: SalesData[];
  isLoading?: boolean;
}

export default function SalesChart({
  salesData,
  isLoading = false,
}: SalesChartProps) {
  const [timeRange, setTimeRange] = useState("7days");

  // Find the maximum value to scale the chart
  const maxAmount = Math.max(...salesData.map((item) => item.amount), 0);

  // Function to get height percentage based on amount
  const getBarHeight = (amount: number) => {
    if (maxAmount === 0) return 0;
    return (amount / maxAmount) * 100;
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
        <div>
          <CardTitle className="text-gray-900 dark:text-white">
            Sales Overview
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Daily revenue for the selected period
          </CardDescription>
        </div>
        <Select
          value={timeRange}
          onValueChange={setTimeRange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[140px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ) : salesData.length > 0 ? (
          <div className="pt-2">
            <div className="flex items-end justify-between h-[200px] gap-2">
              {salesData.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-[40px] bg-primary/20 dark:bg-primary/30 hover:bg-primary/40 dark:hover:bg-primary/50 rounded-t-sm relative group"
                      style={{ height: `${getBarHeight(item.amount)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs py-1 px-2 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${item.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {item.date}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6 text-sm font-medium text-gray-900 dark:text-white">
              <div>
                Total: $
                {salesData
                  .reduce((sum, item) => sum + item.amount, 0)
                  .toFixed(2)}
              </div>
              <div>
                Avg: $
                {(
                  salesData.reduce((sum, item) => sum + item.amount, 0) /
                  salesData.length
                ).toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No sales data available for this period
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
