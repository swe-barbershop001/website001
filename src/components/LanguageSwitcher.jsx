import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { getTranslation } from "../data/translations";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const languages = [
  { code: "uzb", name: "O'zbek", flag: "🇺🇿" },
  { code: "rus", name: "Русский", flag: "🇷🇺" },
  { code: "eng", name: "English", flag: "🇬🇧" },
];

function LanguageSwitcher({ variant = "desktop" }) {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  useEffect(() => {
    if (variant === "mobile") return; // Don't handle outside click for mobile variant
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [variant]);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  // Mobile variant: Show all languages as buttons
  if (variant === "mobile") {
    return (
      <div className="w-full">
        <div className="flex gap-2">
          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`relative flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-barber-gold text-white shadow-md scale-105 border-2 border-barber-gold"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                aria-label={`Switch to ${lang.name}`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className={`text-sm font-semibold ${isActive ? "text-white" : ""}`}>
                  {lang.name}
                </span>
                {isActive && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-lg border-2 border-barber-gold">
                    <svg
                      className="w-3 h-3 text-barber-gold"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop variant: Dropdown menu
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-black dark:text-white hover:text-barber-gold dark:hover:text-barber-gold transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
        aria-label="Change language"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  language === lang.code
                    ? "bg-barber-gold bg-opacity-10 text-barber-gold font-medium"
                    : "text-black dark:text-white"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {language === lang.code && (
                  <span className="ml-auto text-barber-gold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;

