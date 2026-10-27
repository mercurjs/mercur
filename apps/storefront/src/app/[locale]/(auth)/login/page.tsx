import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { LoginForm } from '@/components/molecules/LoginForm/LoginForm';
import { retrieveCustomer } from "@/lib/data/customer"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}

async function LoginPageContent() {
  const user = await retrieveCustomer()

  if (user) {
    redirect("/user")
  }

  return <LoginForm />
}

