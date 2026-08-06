import { ForgotPasswordForm } from "@/components/molecules/ForgotPasswordForm/ForgotPasswordForm"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Create a new password",
  robots: { index: false, follow: false },
}

export default function ForgotPasswordPage() {

  return (
    <main className="container">
      <ForgotPasswordForm />
    </main>
  )
}
