"use client";

import * as React from "react";
import { Check, Globe, Languages } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { languages, type Locale } from "../lib/i18n/config";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  onLocaleChange: (locale: Locale) => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showFlag?: boolean;
  showName?: boolean;
}

export function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  className,
  variant = "outline",
  size = "default",
  showFlag = true,
  showName = false,
}: LanguageSwitcherProps) {
  const currentLanguage = languages[currentLocale];
  const availableLocales = Object.keys(languages) as Locale[];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn("gap-2", className)}
        >
          {size === "icon" ? (
            <Globe className="h-4 w-4" />
          ) : (
            <>
              <Languages className="h-4 w-4" />
              {showFlag && <span>{currentLanguage.flag}</span>}
              {showName && (
                <span className="hidden sm:inline-block">
                  {currentLanguage.nativeName}
                </span>
              )}
              {!showFlag && !showName && currentLocale.toUpperCase()}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Select Language
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableLocales.map((locale) => {
          const language = languages[locale];
          const isSelected = locale === currentLocale;
          
          return (
            <DropdownMenuItem
              key={locale}
              onClick={() => onLocaleChange(locale)}
              className={cn(
                "flex items-center justify-between",
                isSelected && "bg-accent"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{language.nativeName}</span>
                  <span className="text-xs text-muted-foreground">
                    {language.name}
                  </span>
                </div>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          More languages coming soon...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}