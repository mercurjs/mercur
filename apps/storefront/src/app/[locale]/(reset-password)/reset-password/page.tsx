import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { Card } from '@/components/atoms/Card/Card';
import { ProfilePasswordForm } from "@/components/molecules/ProfilePasswordForm/ProfilePasswordForm"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage(props: {
  searchParams: Promise<{ token: string }>
}) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ResetPasswordPageContent {...props} />
    </Suspense>
  )
}

async function ResetPasswordPageContent({
  searchParams,
}: {
  searchParams: Promise<{ token: string }>
}) {
  const { token } = await searchParams

  return (
    <main className="container flex justify-center py-16">
      <Card className="w-full max-w-lg">
        <ProfilePasswordForm token={token} />
      </Card>
    </main>
  )
}
