"use client";

import { useState, useEffect } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { screenAtom, organizationIdAtom, contactSessionIdAtomFamily } from "../../atoms/widget-atoms";
import { WidgetHeader } from "@/modules/widget/ui/components/widget-header";
import { WidgetFooter } from "@/modules/widget/ui/components/widget-footer";
import { Button } from "@workspace/ui/components/button";
import { languages, type Locale } from "@workspace/ui/lib/i18n/config";
import { Globe, Check, ChevronRight, Languages } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";

export const WidgetLanguageScreen = () => {
  const setScreen = useSetAtom(screenAtom);
  const organizationId = useAtomValue(organizationIdAtom);
  const contactSessionId = useAtomValue(
    contactSessionIdAtomFamily(organizationId || "")
  );
  
  const [selectedLanguage, setSelectedLanguage] = useState<Locale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const setUserLanguage = useMutation(api.translations.setUserLanguage);

  // Check if user already has a language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem("widgetLanguage");
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "hi" || savedLanguage === "bn")) {
      // Skip language selection if already set
      setScreen("selection");
    }
  }, [setScreen]);

  const handleLanguageSelect = async (locale: Locale) => {
    setSelectedLanguage(locale);
    setIsLoading(true);
    
    try {
      // Save to localStorage
      localStorage.setItem("widgetLanguage", locale);
      document.documentElement.lang = locale;
      
      // Save to backend if session exists
      if (organizationId && contactSessionId) {
        await setUserLanguage({
          organizationId,
          sessionId: contactSessionId,
          language: locale,
        });
      }
      
      // Proceed to selection screen
      setTimeout(() => {
        setScreen("selection");
      }, 300);
    } catch (error) {
      console.error("Failed to set language:", error);
      setIsLoading(false);
    }
  };

  const supportedLanguages: Locale[] = ["en", "hi", "bn"];
  
  const languageOptions = supportedLanguages.map(locale => ({
    locale,
    ...languages[locale],
    description: getLanguageDescription(locale)
  }));

  function getLanguageDescription(locale: Locale): string {
    switch (locale) {
      case "en":
        return "Continue in English";
      case "hi":
        return "हिंदी में जारी रखें";
      case "bn":
        return "বাংলায় চালিয়ে যান";
      default:
        return "";
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <WidgetHeader>
        <div className="flex flex-col items-center justify-center py-8 px-4 space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
              <Globe className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <Languages className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome! स्वागत है! স্বাগতম!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose your preferred language
            </p>
          </div>
        </div>
      </WidgetHeader>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="grid gap-3 max-w-md mx-auto">
          {languageOptions.map((lang) => {
            const isSelected = selectedLanguage === lang.locale;
            
            return (
              <Button
                key={lang.locale}
                onClick={() => handleLanguageSelect(lang.locale)}
                disabled={isLoading}
                variant="outline"
                className={cn(
                  "relative h-auto p-4 justify-start text-left transition-all duration-200",
                  "border-2 hover:shadow-lg hover:scale-[1.02]",
                  "hover:border-blue-400 dark:hover:border-blue-600",
                  isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
                  isLoading && isSelected && "opacity-70 animate-pulse"
                )}
              >
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{lang.flag}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base text-gray-900 dark:text-white">
                          {lang.nativeName}
                        </span>
                        {lang.locale !== "en" && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({lang.name})
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lang.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <ChevronRight className={cn(
                      "w-5 h-5 text-gray-400 transition-transform",
                      isSelected && "text-blue-500 translate-x-1"
                    )} />
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Additional Information */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 dark:text-amber-400">💡</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Tip: You can change language anytime
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Look for the language icon in the chat menu to switch languages during your conversation.
              </p>
            </div>
          </div>
        </div>

        {/* Quick language facts */}
        <div className="mt-6 grid grid-cols-3 gap-2 max-w-md mx-auto">
          <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
            <p className="text-2xl mb-1">🌍</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">20+ languages coming soon</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
            <p className="text-2xl mb-1">🤖</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">AI-powered translation</p>
          </div>
          <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
            <p className="text-2xl mb-1">⚡</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Real-time chat</p>
          </div>
        </div>
      </div>

      <WidgetFooter />
    </div>
  );
};