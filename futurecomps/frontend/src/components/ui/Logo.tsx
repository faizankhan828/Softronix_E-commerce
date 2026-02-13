import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className, alt = "Softronix" }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
        <span className="text-white font-bold text-lg">S</span>
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
        Softronix
      </span>
    </div>
  );
}
