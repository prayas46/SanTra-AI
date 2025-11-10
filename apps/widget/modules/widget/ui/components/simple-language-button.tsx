"use client";

import { useAtom } from "jotai";
import { widgetLanguageAtom } from "../../atoms/widget-atoms";
import { Button } from "@workspace/ui/components/button";

export const SimpleLanguageButton = () => {
  const [language, setLanguage] = useAtom(widgetLanguageAtom);
  
  const toggleLanguage = () => {
    const next = language === 'en' ? 'hi' : language === 'hi' ? 'bn' : 'en';
    setLanguage(next);
    localStorage.setItem('widgetLanguage', next);
    console.log('Language changed to:', next);
  };
  
  const flags = { en: '🇬🇧', hi: '🇮🇳', bn: '🇮🇳' };
  const names = { en: 'English', hi: 'हिन्दी', bn: 'বাংলা' };
  
  return (
    <Button 
      onClick={toggleLanguage}
      variant="ghost" 
      size="icon"
      className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
      title={`Language: ${names[language]} (Click to change)`}
    >
      <span className="text-xl">{flags[language]}</span>
    </Button>
  );
};