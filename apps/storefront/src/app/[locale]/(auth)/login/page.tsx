import { LoginForm } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  const user = await retrieveCustomer()

  if (user) {
    redirect("/user")
  }

  return <LoginForm />
}

