import { NextRequest, NextResponse } from 'next/server';
import Negotiator from 'negotiator';
import { match } from '@formatjs/intl-localematcher';
import { i18nConfig } from '@workspace/ui/lib/i18n/config';

function getLocale(request: NextRequest): string {
  // Check if locale is stored in cookie
  const cookieLocale = request.cookies.get('locale')?.value;
  if (cookieLocale && i18nConfig.locales.includes(cookieLocale as any)) {
    return cookieLocale;
  }

  // Negotiator expects plain object so we transform headers
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  // Use negotiator to get preferred languages
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  
  // Match against our supported locales
  try {
    return match(languages, [...i18nConfig.locales], i18nConfig.defaultLocale);
  } catch {
    return i18nConfig.defaultLocale;
  }
}

export function i18nMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check if pathname already has a locale
  const pathnameHasLocale = i18nConfig.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Extract locale from pathname and set cookie
    const locale = pathname.split('/')[1];
    if (locale) {
      const response = NextResponse.next();
      response.cookies.set('locale', locale, { maxAge: 60 * 60 * 24 * 365 }); // 1 year
      return response;
    }
  }

  // Redirect if no locale
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  
  const response = NextResponse.redirect(newUrl);
  response.cookies.set('locale', locale, { maxAge: 60 * 60 * 24 * 365 }); // 1 year
  
  return response;
}