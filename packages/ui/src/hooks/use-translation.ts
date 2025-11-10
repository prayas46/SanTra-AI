"use client";

import { useState, useEffect, useCallback } from "react";
import { Locale } from "../lib/i18n/config";
import { loadTranslation, getNestedTranslation, detectUserLanguage } from "../lib/i18n/utils";

interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isLoading: boolean;
  formatNumber: (value: number) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
}

export function useTranslation(): UseTranslationReturn {
  const [locale, setLocaleState] = useState<Locale>(() => detectUserLanguage());
  const [translations, setTranslations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load translations when locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        const trans = await loadTranslation(locale);
        setTranslations(trans);
        
        // Save locale preference
        if (typeof window !== "undefined") {
          localStorage.setItem("locale", locale);
          document.documentElement.lang = locale;
          
          // Add dir attribute for RTL languages (when Urdu is added)
          // document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
        }
      } catch (error) {
        console.error("Failed to load translations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [locale]);

  // Translation function
  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      if (!translations) return key;
      return getNestedTranslation(translations, key, params);
    },
    [translations]
  );

  // Set locale function
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  // Number formatting
  const formatNumber = useCallback(
    (value: number): string => {
      const localeMap = {
        en: "en-IN",
        hi: "hi-IN",
        bn: "bn-BD",
      };
      return new Intl.NumberFormat(localeMap[locale]).format(value);
    },
    [locale]
  );

  // Date formatting
  const formatDate = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions): string => {
      const localeMap = {
        en: "en-IN",
        hi: "hi-IN",
        bn: "bn-BD",
      };
      return new Intl.DateTimeFormat(localeMap[locale], options).format(date);
    },
    [locale]
  );

  // Currency formatting
  const formatCurrency = useCallback(
    (amount: number, currency: string = "INR"): string => {
      const localeMap = {
        en: "en-IN",
        hi: "hi-IN",
        bn: "bn-BD",
      };
      return new Intl.NumberFormat(localeMap[locale], {
        style: "currency",
        currency,
      }).format(amount);
    },
    [locale]
  );

  return {
    t,
    locale,
    setLocale,
    isLoading,
    formatNumber,
    formatDate,
    formatCurrency,
  };
}