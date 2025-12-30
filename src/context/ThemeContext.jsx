import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const AppThemeProvider = ({ children }) => {
  // Function to get system theme preference
  const getSystemTheme = () => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  const [theme, setTheme] = useState(() => {
    const systemTheme = getSystemTheme();
    
    // Apply theme immediately on mount (before React renders)
    if (typeof document !== "undefined") {
      if (systemTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    
    return systemTheme;
  });

  useEffect(() => {
    // Listen for system theme changes
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleThemeChange = (e) => {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        
        // Apply theme class to document root
        if (newTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      };

      // Listen for changes
      mediaQuery.addEventListener("change", handleThemeChange);
      
      // Apply initial theme
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      return () => {
        mediaQuery.removeEventListener("change", handleThemeChange);
      };
    } else {
      // Fallback for browsers that don't support matchMedia
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  const value = {
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Export as ThemeProvider for convenience (but use AppThemeProvider to avoid conflicts)
export { AppThemeProvider as ThemeProvider };

