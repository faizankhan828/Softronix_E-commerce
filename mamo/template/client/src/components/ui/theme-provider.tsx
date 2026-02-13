import { ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useTheme();

  return (
    <div data-theme={theme} className="transition-colors duration-300">
      {children}
    </div>
  );
}
