import { Footer, Header } from "@/components/organisms"
import { checkRegion } from "@/lib/helpers/check-region"
import { NOINDEX_ROBOTS } from "@/lib/helpers/seo"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
}

export default async function ResetPasswordLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  const regionCheck = await checkRegion(locale)

  if (!regionCheck) {
    return redirect("/")
  }

  return (
    <>
      <Header locale={locale} />
      {children}
      <Footer />
    </>
  )
}
