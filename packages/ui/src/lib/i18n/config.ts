export const i18nConfig = {
  defaultLocale: 'en',
  locales: [
    'en',    // English
    'hi',    // Hindi
    'bn',    // Bengali
    // Add more languages as needed:
    // 'ta',    // Tamil
    // 'te',    // Telugu
    // 'mr',    // Marathi
    // 'gu',    // Gujarati
    // 'kn',    // Kannada
    // 'ml',    // Malayalam
    // 'pa',    // Punjabi
    // 'or',    // Odia
    // 'as',    // Assamese
    // 'ur',    // Urdu (RTL)
  ] as const,
  rtlLocales: [], // Add 'ur' when Urdu is added
} as const;

export type Locale = (typeof i18nConfig.locales)[number];

export const languages = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  // Future Indian languages:
  // ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  // te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  // mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  // gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  // kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  // ml: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  // pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  // or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  // as: { name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
  // ur: { name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
} as const;

export function isRTL(locale: string): boolean {
  // Currently no RTL languages in the config
  // When adding Urdu, check like this: return locale === 'ur';
  return false;
}
