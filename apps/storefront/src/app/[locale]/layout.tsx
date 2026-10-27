import { redirect } from "next/navigation"

import { CartDrawer } from "@/components/cells/CartDrawer/CartDrawer"
import { LocaleProvider } from "@/components/providers/Locale/LocaleProvider"
import { listCountryCodes } from "@/lib/data/regions"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

export async function generateStaticParams() {
  const countryCodes = await listCountryCodes()
  const locales = countryCodes.length ? countryCodes : [DEFAULT_REGION]
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params

  const countryCodes = await listCountryCodes()
  if (countryCodes.length && !countryCodes.includes(locale)) {
    redirect("/")
  }

  return (
    <LocaleProvider locale={locale}>
      {children}
      <CartDrawer />
    </LocaleProvider>
  )
}
