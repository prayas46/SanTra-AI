import { Locale } from './i18n/config';

// Interface for translation providers
interface TranslationProvider {
  translate(text: string, from: string, to: string): Promise<string>;
  detectLanguage(text: string): Promise<{ language: string; confidence: number }>;
}

// OpenAI Translation Provider (using GPT for translation)
class OpenAITranslationProvider implements TranslationProvider {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async translate(text: string, from: string, to: string): Promise<string> {
    const languageNames = {
      en: 'English',
      hi: 'Hindi',
      bn: 'Bengali',
    };
    
    try {
      const response = await fetch('/api/translate/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang: languageNames[from as keyof typeof languageNames] || from,
          targetLang: languageNames[to as keyof typeof languageNames] || to,
        }),
      });
      
      if (!response.ok) throw new Error('Translation failed');
      
      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw error;
    }
  }
  
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    // Simple heuristic detection for Indian languages
    // Check for Devanagari script (Hindi)
    if (/[\u0900-\u097F]/.test(text)) {
      return { language: 'hi', confidence: 0.9 };
    }
    
    // Check for Bengali script
    if (/[\u0980-\u09FF]/.test(text)) {
      return { language: 'bn', confidence: 0.9 };
    }
    
    // Default to English
    return { language: 'en', confidence: 0.7 };
  }
}

// Google Translate Provider (using Google Translate API)
class GoogleTranslateProvider implements TranslationProvider {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async translate(text: string, from: string, to: string): Promise<string> {
    try {
      const response = await fetch('/api/translate/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source: from,
          target: to,
        }),
      });
      
      if (!response.ok) throw new Error('Translation failed');
      
      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.error('Google Translate error:', error);
      throw error;
    }
  }
  
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      const response = await fetch('/api/translate/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) throw new Error('Language detection failed');
      
      const data = await response.json();
      return data;
    } catch (error) {
      // Fallback to heuristic detection
      if (/[\u0900-\u097F]/.test(text)) {
        return { language: 'hi', confidence: 0.9 };
      }
      if (/[\u0980-\u09FF]/.test(text)) {
        return { language: 'bn', confidence: 0.9 };
      }
      return { language: 'en', confidence: 0.7 };
    }
  }
}

// Translation Service Manager
export class TranslationService {
  private provider: TranslationProvider;
  private cache: Map<string, string> = new Map();
  
  constructor(providerType: 'openai' | 'google' = 'openai', apiKey?: string) {
    // In production, get API key from environment or server
    const key = apiKey || process.env.NEXT_PUBLIC_TRANSLATION_API_KEY || '';
    
    if (providerType === 'google') {
      this.provider = new GoogleTranslateProvider(key);
    } else {
      this.provider = new OpenAITranslationProvider(key);
    }
  }
  
  // Generate cache key
  private getCacheKey(text: string, from: string, to: string): string {
    return `${from}-${to}-${text}`;
  }
  
  // Translate text with caching
  async translateText(
    text: string,
    from: Locale,
    to: Locale,
    useCache: boolean = true
  ): Promise<string> {
    // Don't translate if source and target are the same
    if (from === to) return text;
    
    // Check cache first
    const cacheKey = this.getCacheKey(text, from, to);
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    try {
      const translatedText = await this.provider.translate(text, from, to);
      
      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, translatedText);
      }
      
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      // Return original text if translation fails
      return text;
    }
  }
  
  // Translate multiple texts in batch
  async translateBatch(
    texts: string[],
    from: Locale,
    to: Locale
  ): Promise<string[]> {
    return Promise.all(texts.map(text => this.translateText(text, from, to)));
  }
  
  // Detect language of text
  async detectLanguage(text: string): Promise<Locale> {
    try {
      const result = await this.provider.detectLanguage(text);
      
      // Map detected language to our supported locales
      if (result.language === 'hi' || result.language === 'hin') return 'hi';
      if (result.language === 'bn' || result.language === 'ben') return 'bn';
      return 'en';
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }
  
  // Clear translation cache
  clearCache(): void {
    this.cache.clear();
  }
  
  // Get cache size
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Singleton instance
let translationServiceInstance: TranslationService | null = null;

// Get or create translation service instance
export function getTranslationService(): TranslationService {
  if (!translationServiceInstance) {
    translationServiceInstance = new TranslationService('openai');
  }
  return translationServiceInstance;
}