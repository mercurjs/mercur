import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { RegisterForm } from '@/components/molecules/RegisterForm/RegisterForm';
import { retrieveCustomer } from "@/lib/data/customer"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Register",
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RegisterPageContent />
    </Suspense>
  )
}

async function RegisterPageContent() {
  const user = await retrieveCustomer()

  if (user) {
    redirect("/user")
  }

  return <RegisterForm />
}

