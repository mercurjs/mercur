import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { LoginForm } from '@/components/molecules/LoginForm/LoginForm';
import { ProfileDetails } from '@/components/molecules/ProfileDetails/ProfileDetails';
import { UserNavigation } from '@/components/molecules/UserNavigation/UserNavigation';
import { ProfilePassword } from "@/components/molecules/ProfileDetails/ProfilePassword"
import { retrieveCustomer } from "@/lib/data/customer"

export default function ReviewsPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ReviewsPageContent />
    </Suspense>
  )
}

async function ReviewsPageContent() {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  return (
    <main className="container" data-testid="profile-settings-page">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3" data-testid="profile-settings-container">
          <h1 className="heading-md uppercase mb-8">Settings</h1>
          <ProfileDetails user={user} />
          <ProfilePassword user={user} />
        </div>
      </div>
    </main>
  )
}
