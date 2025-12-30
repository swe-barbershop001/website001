import { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleThemeChange = (newTheme) => {
    if (newTheme !== theme) {
      toggleTheme();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-black dark:text-white hover:text-barber-gold dark:hover:text-barber-gold transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
        aria-label="Change theme"
      >
        {theme === "light" ? (
          <SunIcon className="w-5 h-5" />
        ) : (
          <MoonIcon className="w-5 h-5" />
        )}
        <span className="hidden sm:inline capitalize">{theme}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            <button
              onClick={() => handleThemeChange("light")}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                theme === "light"
                  ? "bg-barber-gold bg-opacity-10 text-barber-gold font-medium"
                  : "text-black dark:text-white"
              }`}
            >
              <SunIcon className="w-5 h-5" />
              <span>Light</span>
              {theme === "light" && (
                <span className="ml-auto text-barber-gold">✓</span>
              )}
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                theme === "dark"
                  ? "bg-barber-gold bg-opacity-10 text-barber-gold font-medium"
                  : "text-black dark:text-white"
              }`}
            >
              <MoonIcon className="w-5 h-5" />
              <span>Dark</span>
              {theme === "dark" && (
                <span className="ml-auto text-barber-gold">✓</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;

