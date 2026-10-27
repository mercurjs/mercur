import { Suspense } from "react"
import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { UserNavigation } from '@/components/molecules/UserNavigation/UserNavigation';
import { retrieveCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"
import { Addresses } from '@/components/organisms/Addressess/Addresses';
import { listRegions } from "@/lib/data/regions"

export default function Page() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <PageContent />
    </Suspense>
  )
}

async function PageContent() {
  const user = await retrieveCustomer()
  const regions = await listRegions()

  if (!user) {
    redirect("/login")
  }

  return (
    <main className="container" data-testid="addresses-page">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <Addresses {...{ user, regions }} />
      </div>
    </main>
  )
}
