import React, { createContext, useContext, useState } from 'react';

interface LanguageContextProps {
  isEnglish: boolean;
  setIsEnglish: (value: boolean) => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEnglish, setIsEnglish] = useState(false);
  return (
    <LanguageContext.Provider value={{ isEnglish, setIsEnglish }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
