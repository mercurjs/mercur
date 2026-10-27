import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { RegisterForm } from '@/components/molecules/RegisterForm/RegisterForm';
import { retrieveCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"

export default function Page() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <PageContent />
    </Suspense>
  )
}

async function PageContent() {
  const user = await retrieveCustomer()

  if (user) {
    redirect("/user")
  }

  return <RegisterForm />
}
