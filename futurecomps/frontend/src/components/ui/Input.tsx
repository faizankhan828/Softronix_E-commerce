import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-input bg-background text-foreground px-4 py-2 text-sm shadow-sm transition-all duration-200",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700",
            icon && "pl-10",
            error && "border-destructive focus:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
