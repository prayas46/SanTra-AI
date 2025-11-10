"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { widgetLanguageAtom } from "../../atoms/widget-atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { Languages, Check } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "বাংলা", flag: "🇮🇳" },
] as const;

export const WidgetLanguageSwitcher = () => {
  const [currentLanguage, setCurrentLanguage] = useAtom(widgetLanguageAtom);
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode: "en" | "hi" | "bn") => {
    setCurrentLanguage(langCode);
    localStorage.setItem("widgetLanguage", langCode);
    document.documentElement.lang = langCode;
    setIsOpen(false);
    
    // You could trigger a toast notification here
    // toast.success(`Language changed to ${languages.find(l => l.code === langCode)?.name}`);
  };

  const currentLang = languages.find(l => l.code === currentLanguage);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200"
          title="Change Language"
        >
          <span className="text-lg">{currentLang?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Select Language
        </div>
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "flex items-center justify-between px-2 py-1.5",
              currentLanguage === lang.code && "bg-accent"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{lang.flag}</span>
              <span className="text-sm">{lang.name}</span>
            </div>
            {currentLanguage === lang.code && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};