import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"
import { headers } from "next/headers"

import { listRegions } from "@/lib/data/regions"
import {
  buildHreflangAlternates,
  getStorefrontLocales,
} from "@/lib/helpers/hreflang"

export const generateProductMetadata = async (
  product: HttpTypes.StoreProduct,
  locale: string
): Promise<Metadata> => {
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`

  let locales: string[] = []
  try {
    locales = getStorefrontLocales(await listRegions())
  } catch {
    locales = [locale]
  }

  const { canonical, languages } = buildHreflangAlternates({
    baseUrl,
    path: `/products/${product?.handle}`,
    locale,
    locales,
  })

  return {
    title: product?.title,
    description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
    robots: "index, follow",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical,
      languages,
    },

    openGraph: {
      title: product?.title,
      description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      url: canonical,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME,
      images: [
        {
          url:
            product?.thumbnail ||
            `${protocol}://${host}/images/placeholder.svg`,
          width: 1200,
          height: 630,
          alt: product?.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product?.title,
      description: `${product?.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      images: [
        product?.thumbnail || `${protocol}://${host}/images/placeholder.svg`,
      ],
    },
  }
}

export const generateCategoryMetadata = async (
  category: HttpTypes.StoreProductCategory
) => {
  const headersList = await headers()
  const host = headersList.get("host")
  const protocol = headersList.get("x-forwarded-proto") || "https"

  return {
    robots: "index, follow",
    metadataBase: new URL(
      `${protocol}://${host}/categories/${category.handle}`
    ),
    title: `${category.name} Category`,
    description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,

    openGraph: {
      title: category.name,
      description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      url: `${protocol}://${host}/categories/${category.handle}`,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME,
      images: [
        {
          url:
            `${protocol}://${host}/images/categories/${category.handle}.png` ||
            `${protocol}://${host}/images/placeholder.svg`,
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: category.name,
      description: `${category.name} Category - ${process.env.NEXT_PUBLIC_SITE_NAME}`,
      images: [
        `${protocol}://${host}/images/categories/${category.handle}.png` ||
          `${protocol}://${host}/images/placeholder.svg`,
      ],
    },
  }
}
