import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'uzb'
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage || "uzb";
  });

  useEffect(() => {
    // Save language to localStorage whenever it changes
    localStorage.setItem("language", language);
  }, [language]);

  const changeLanguage = (lang) => {
    if (["rus", "eng", "uzb"].includes(lang)) {
      setLanguage(lang);
    }
  };

  const value = {
    language,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

