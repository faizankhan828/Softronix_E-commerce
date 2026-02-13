import { useTheme } from "../../contexts/ThemeContext";
import { cn } from "../../lib/utils";

interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className, alt = "Logo" }: LogoProps) {
  const { theme } = useTheme();

  // Use white logo on dark background, black logo on light background
  const logoSrc = theme === "dark" ? "/Blackmode.png" : "/Whitemode.png";

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={cn(
        "max-h-12 object-contain transition-opacity duration-300",
        className
      )}
    />
  );
}
