import { Locale } from './config';

// Translation storage
const translations: Record<string, any> = {};

// Load translation for a specific locale
export async function loadTranslation(locale: Locale) {
  if (!translations[locale]) {
    try {
      const module = await import(`./translations/${locale}.json`);
      translations[locale] = module.default;
    } catch (error) {
      console.error(`Failed to load translation for locale: ${locale}`, error);
      // Fallback to English if translation fails
      if (locale !== 'en') {
        const enModule = await import('./translations/en.json');
        translations[locale] = enModule.default;
      }
    }
  }
  return translations[locale];
}

// Get nested translation value
export function getNestedTranslation(translations: any, key: string, params?: Record<string, string>) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    value = value?.[k];
    if (!value) return key; // Return key if translation not found
  }
  
  // Replace parameters if any
  if (params && typeof value === 'string') {
    Object.entries(params).forEach(([param, paramValue]) => {
      value = value.replace(`{${param}}`, paramValue);
    });
  }
  
  return value;
}

// Detect user's preferred language from browser
export function detectUserLanguage(): Locale {
  if (typeof window === 'undefined') return 'en';
  
  // Check localStorage first
  const storedLocale = localStorage.getItem('locale');
  if (storedLocale && isValidLocale(storedLocale)) {
    return storedLocale as Locale;
  }
  
  // Check browser language
  const browserLang = navigator.language.toLowerCase();
  
  // Map browser language to our supported locales
  if (browserLang.startsWith('hi')) return 'hi';
  if (browserLang.startsWith('bn')) return 'bn';
  if (browserLang.startsWith('en')) return 'en';
  
  // Default to English
  return 'en';
}

// Validate if a locale is supported
export function isValidLocale(locale: string): boolean {
  return ['en', 'hi', 'bn'].includes(locale);
}

// Format number based on locale
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : locale === 'hi' ? 'hi-IN' : 'en-US').format(value);
}

// Format date based on locale
export function formatDate(date: Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  const localeMap = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'bn': 'bn-BD'
  };
  
  return new Intl.DateTimeFormat(localeMap[locale], options).format(date);
}

// Format currency based on locale
export function formatCurrency(amount: number, locale: Locale, currency: string = 'INR'): string {
  const localeMap = {
    'en': 'en-IN',
    'hi': 'hi-IN',
    'bn': 'bn-BD'
  };
  
  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency: currency
  }).format(amount);
}