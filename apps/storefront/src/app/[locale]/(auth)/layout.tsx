import { Footer, Header } from "@/components/organisms"
import { checkRegion } from "@/lib/helpers/check-region"
import { redirect } from "next/navigation"

export default async function AuthLayout({
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

