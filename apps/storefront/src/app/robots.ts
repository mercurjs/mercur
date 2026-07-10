import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL

  if (base) {
    return {
      rules: [{ userAgent: "*", allow: "/" }],
      sitemap: `${base.replace(/\/$/, "")}/sitemap.xml`,
    }
  }

  return {
    rules: [{ userAgent: "*", allow: "/" }],
  }
}
