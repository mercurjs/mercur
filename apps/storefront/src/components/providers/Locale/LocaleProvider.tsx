"use client"

import { createContext, PropsWithChildren, useContext, useEffect } from "react"

import { toHreflang } from "@/lib/helpers/hreflang"

const LocaleContext = createContext<string | null>(null)

export function LocaleProvider({ children, locale }: PropsWithChildren<{ locale: string }>) {
  useEffect(() => {
    document.documentElement.lang = toHreflang(locale)
  }, [locale])

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

// Reading the locale from the [locale] layout instead of useParams() keeps links
// out of Suspense, so they render in every route's static shell.
export function useLocale() {
  return useContext(LocaleContext) || process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
}
