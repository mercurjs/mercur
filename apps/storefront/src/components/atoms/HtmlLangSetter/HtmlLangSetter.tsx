'use client';

import { useEffect } from 'react';

import { usePathname } from 'next/navigation';

import { toHreflang } from '@/lib/helpers/hreflang';

export function HtmlLangSetter() {
  const pathname = usePathname();

  useEffect(() => {
    // get locale from the path
    const localeMatch = pathname?.match(/^\/([a-z]{2})(?:\/|$)/i);
    const locale = localeMatch?.[1] || 'en';
    const htmlLang = toHreflang(locale);

    // set lang on the html element
    if (typeof document !== 'undefined') {
      document.documentElement.lang = htmlLang;
    }
  }, [pathname]);

  return null;
}
