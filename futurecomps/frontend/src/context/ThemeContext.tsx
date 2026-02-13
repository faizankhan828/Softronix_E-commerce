"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  ThemeIcon: React.ReactNode;
};

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>("light");

  // Initialize theme from localStorage only (ignore system preference)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;

    // Always default to light theme unless user explicitly changed it
    let initialTheme: Theme = savedTheme || "light";

    setTheme(initialTheme);

    // Apply theme class
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);

      // Toggle dark class
      if (newTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      return newTheme;
    });
  };

  // Current theme icon
  const ThemeIcon =
    theme === "light" ? (
      <Moon className="w-5 h-5" />
    ) : (
      <Sun className="w-5 h-5" />
    );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, ThemeIcon }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
