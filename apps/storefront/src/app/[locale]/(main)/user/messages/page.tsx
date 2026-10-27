import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { UserMessagesSection } from "@/components/sections/UserMessagesSection/UserMessagesSection"
import { retrieveCustomer } from "@/lib/data/customer"

export default function MessagesPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <MessagesPageContent />
    </Suspense>
  )
}

async function MessagesPageContent() {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  return (
    <main className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3 space-y-8">
          <UserMessagesSection />
        </div>
      </div>
    </main>
  )
}
