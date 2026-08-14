import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"

import {
  StoreOffer,
  getOfferAmount,
  isPurchasable,
} from "./buybox"

export const DEFAULT_SITE_NAME =
  "Mercur B2C Demo - Marketplace Storefront"
export const DEFAULT_SITE_DESCRIPTION =
  "Shop a multi-vendor marketplace from your phone, desktop, or browser."

export const INDEX_ROBOTS = { index: true, follow: true } as const
export const NOINDEX_ROBOTS = { index: false, follow: false } as const

export const PRIVATE_ROBOTS_PATHS = [
  "/*/cart",
  "/*/checkout",
  "/*/user",
  "/*/login",
  "/*/register",
  "/*/forgot-password",
  "/*/reset-password",
  "/*/order/",
]

export const siteName = (): string =>
  process.env.NEXT_PUBLIC_SITE_NAME || DEFAULT_SITE_NAME

export const siteDescription = (): string =>
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || DEFAULT_SITE_DESCRIPTION

export const resolveBaseUrl = (
  host?: string | null,
  protocol?: string | null
): string => {
  const fromEnv = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "")
  if (fromEnv) {
    return fromEnv
  }
  if (host) {
    return `${protocol || "https"}://${host}`
  }
  return "http://localhost:3000"
}

export const toPlainText = (
  value: string | null | undefined,
  max = 160
): string => {
  if (!value) {
    return ""
  }

  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (text.length <= max) {
    return text
  }

  return `${text.slice(0, max - 1).trimEnd()}…`
}

export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c")

export type PublicPageMetadataInput = {
  title: string
  description: string
  canonical: string
  languages?: Record<string, string>
  image?: string
  imageAlt?: string
  index?: boolean
}

export const buildPublicPageMetadata = ({
  title,
  description,
  canonical,
  languages,
  image,
  imageAlt,
  index = true,
}: PublicPageMetadataInput): Metadata => {
  const name = siteName()
  const ogTitle = `${title} | ${name}`
  const robots = index
    ? {
        ...INDEX_ROBOTS,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large" as const,
          "max-video-preview": -1,
          "max-snippet": -1,
        },
      }
    : NOINDEX_ROBOTS

  return {
    title,
    description,
    robots,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      siteName: name,
      type: "website",
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: imageAlt || title }]
        : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export type CatalogHandle = {
  handle: string
  updatedAt?: string | Date | null
}

export type CatalogSitemapInput = {
  baseUrl: string
  locales: string[]
  products: CatalogHandle[]
  categories: CatalogHandle[]
  collections: CatalogHandle[]
  sellers: CatalogHandle[]
}

export type SitemapEntry = {
  url: string
  lastModified?: Date
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never"
  priority: number
}

const localeUrl = (baseUrl: string, locale: string, path: string): string =>
  `${baseUrl}/${locale}${path}`

export const buildCatalogSitemapEntries = ({
  baseUrl,
  locales,
  products,
  categories,
  collections,
  sellers,
}: CatalogSitemapInput): SitemapEntry[] => {
  const origin = baseUrl.replace(/\/$/, "")
  const codes = locales.length ? locales : ["us"]
  const entries: SitemapEntry[] = []

  for (const locale of codes) {
    entries.push({
      url: localeUrl(origin, locale, ""),
      changeFrequency: "daily",
      priority: 1,
    })
    entries.push({
      url: localeUrl(origin, locale, "/categories"),
      changeFrequency: "daily",
      priority: 0.8,
    })

    for (const category of categories) {
      if (!category.handle) continue
      entries.push({
        url: localeUrl(origin, locale, `/categories/${category.handle}`),
        lastModified: category.updatedAt
          ? new Date(category.updatedAt)
          : undefined,
        changeFrequency: "daily",
        priority: 0.8,
      })
    }

    for (const collection of collections) {
      if (!collection.handle) continue
      entries.push({
        url: localeUrl(origin, locale, `/collections/${collection.handle}`),
        lastModified: collection.updatedAt
          ? new Date(collection.updatedAt)
          : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }

    for (const product of products) {
      if (!product.handle) continue
      entries.push({
        url: localeUrl(origin, locale, `/products/${product.handle}`),
        lastModified: product.updatedAt
          ? new Date(product.updatedAt)
          : undefined,
        changeFrequency: "daily",
        priority: 0.9,
      })
    }

    for (const seller of sellers) {
      if (!seller.handle) continue
      entries.push({
        url: localeUrl(origin, locale, `/sellers/${seller.handle}`),
        lastModified: seller.updatedAt
          ? new Date(seller.updatedAt)
          : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      })
    }
  }

  return entries
}

export type ProductJsonLdInput = {
  product: Pick<
    HttpTypes.StoreProduct,
    "title" | "handle" | "description" | "thumbnail" | "images"
  >
  canonical: string
  offers: StoreOffer[]
}

export const buildProductJsonLd = ({
  product,
  canonical,
  offers,
}: ProductJsonLdInput): Record<string, unknown> => {
  const amounts = offers
    .map((offer) => getOfferAmount(offer))
    .filter((amount): amount is number => amount !== null)
  const currency =
    offers.find((offer) => offer.calculated_price?.currency_code)
      ?.calculated_price?.currency_code || undefined
  const inStock = offers.some(isPurchasable)
  const image =
    product.thumbnail || product.images?.[0]?.url || undefined

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url: canonical,
    description:
      toPlainText(product.description, 300) ||
      `${product.title} — ${siteName()}`,
  }

  if (image) {
    jsonLd.image = [image]
  }

  if (amounts.length && currency) {
    jsonLd.offers = {
      "@type": "AggregateOffer",
      url: canonical,
      priceCurrency: currency.toUpperCase(),
      lowPrice: Math.min(...amounts),
      highPrice: Math.max(...amounts),
      offerCount: offers.length,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    }
  }

  return jsonLd
}

export type SellerJsonLdInput = {
  name: string
  canonical: string
  description?: string | null
  logo?: string | null
}

export const buildSellerJsonLd = ({
  name,
  canonical,
  description,
  logo,
}: SellerJsonLdInput): Record<string, unknown> => {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: canonical,
  }

  const plain = toPlainText(description, 300)
  if (plain) {
    jsonLd.description = plain
  }
  if (logo) {
    jsonLd.logo = logo
  }

  return jsonLd
}
