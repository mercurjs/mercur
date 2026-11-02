import { Suspense } from "react"

import { RouteFallback } from "@/components/molecules/RouteFallback/RouteFallback"
import { CustomerTalkJsProvider } from "@/components/providers/TalkJs/CustomerTalkJsProvider"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-mt-6">
      <Suspense fallback={<RouteFallback />}>
        <CustomerTalkJsProvider>{children}</CustomerTalkJsProvider>
      </Suspense>
    </div>
  )
}
