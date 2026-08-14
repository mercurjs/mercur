import type { MetadataRoute } from "next"

import { PRIVATE_ROBOTS_PATHS, resolveBaseUrl } from "@/lib/helpers/seo"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL
  const origin = base ? resolveBaseUrl() : undefined

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_ROBOTS_PATHS,
      },
    ],
    sitemap: origin ? `${origin}/sitemap.xml` : undefined,
  }
}
