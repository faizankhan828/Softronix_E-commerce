import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface SalesData {
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-sm">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
          <p className="text-sm text-primary">
            Sales: ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
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
          <div className="space-y-3 pt-4">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : salesData.length > 0 ? (
          <div className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesData}
                margin={{
                  top: 5,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#6B7280", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="amount"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="flex justify-between items-center mt-4 text-sm font-medium text-gray-900 dark:text-white px-2">
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
