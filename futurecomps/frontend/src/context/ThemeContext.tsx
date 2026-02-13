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
  undefined
);

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>("light");

  // Initialize theme from localStorage if available
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
      // Apply better dark mode colors
      if (savedTheme === "dark") {
        document.documentElement.style.setProperty("--background", "#121212");
        document.documentElement.style.setProperty("--foreground", "#e0e0e0");
      } else {
        document.documentElement.style.removeProperty("--background");
        document.documentElement.style.removeProperty("--foreground");
      }
    } else if (prefersDark) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      // Apply better dark mode colors
      document.documentElement.style.setProperty("--background", "#121212");
      document.documentElement.style.setProperty("--foreground", "#e0e0e0");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");

      // Apply better dark mode colors
      if (newTheme === "dark") {
        document.documentElement.style.setProperty("--background", "#121212");
        document.documentElement.style.setProperty("--foreground", "#e0e0e0");
      } else {
        document.documentElement.style.removeProperty("--background");
        document.documentElement.style.removeProperty("--foreground");
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
