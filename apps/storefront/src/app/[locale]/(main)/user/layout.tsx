import { NOINDEX_ROBOTS } from "@/lib/helpers/seo"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account",
  robots: NOINDEX_ROBOTS,
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="-mt-6">{children}</div>
}
