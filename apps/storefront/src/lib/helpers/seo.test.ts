import { describe, expect, test } from "bun:test"

import {
  buildCatalogSitemapEntries,
  buildProductJsonLd,
  buildPublicPageMetadata,
  buildSellerJsonLd,
  resolveBaseUrl,
  serializeJsonLd,
  toPlainText,
} from "./seo"

describe("toPlainText", () => {
  test("strips tags and truncates", () => {
    expect(toPlainText("<p>Soft <strong>wool</strong> coat</p>")).toBe(
      "Soft wool coat"
    )
    expect(toPlainText("a".repeat(200), 20)).toBe(`${"a".repeat(19)}…`)
  })

  test("returns empty for missing values", () => {
    expect(toPlainText(null)).toBe("")
    expect(toPlainText("   ")).toBe("")
  })
})

describe("resolveBaseUrl", () => {
  test("returns an origin without a trailing slash", () => {
    const url = resolveBaseUrl("shop.example", "https")
    expect(url.startsWith("http")).toBe(true)
    expect(url.endsWith("/")).toBe(false)
  })
})

describe("buildPublicPageMetadata", () => {
  test("marks private pages noindex", () => {
    const metadata = buildPublicPageMetadata({
      title: "Cart",
      description: "Your cart",
      canonical: "https://shop.example/us/cart",
      index: false,
    })
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })

  test("sets canonical and open graph on public pages", () => {
    const metadata = buildPublicPageMetadata({
      title: "Coats",
      description: "Shop coats",
      canonical: "https://shop.example/us/categories/coats",
      languages: { "en-US": "https://shop.example/us/categories/coats" },
      image: "https://shop.example/og.png",
    })
    expect(metadata.alternates).toEqual({
      canonical: "https://shop.example/us/categories/coats",
      languages: { "en-US": "https://shop.example/us/categories/coats" },
    })
    expect(metadata.openGraph?.url).toBe(
      "https://shop.example/us/categories/coats"
    )
  })
})

describe("buildCatalogSitemapEntries", () => {
  test("emits locale-prefixed catalog URLs", () => {
    const entries = buildCatalogSitemapEntries({
      baseUrl: "https://shop.example",
      locales: ["us", "de"],
      products: [{ handle: "wool-coat" }],
      categories: [{ handle: "coats" }],
      collections: [{ handle: "winter" }],
      sellers: [{ handle: "acme" }],
    })
    const urls = entries.map((entry) => entry.url)

    expect(urls).toContain("https://shop.example/us")
    expect(urls).toContain("https://shop.example/de/categories")
    expect(urls).toContain("https://shop.example/us/products/wool-coat")
    expect(urls).toContain("https://shop.example/de/sellers/acme")
    expect(urls).toContain("https://shop.example/us/collections/winter")
  })

  test("skips empty handles", () => {
    const entries = buildCatalogSitemapEntries({
      baseUrl: "https://shop.example",
      locales: ["us"],
      products: [{ handle: "" }],
      categories: [{ handle: "" }],
      collections: [{ handle: "" }],
      sellers: [{ handle: "" }],
    })
    const urls = entries.map((entry) => entry.url)
    expect(urls.some((url) => url.includes("/products/"))).toBe(false)
    expect(urls.some((url) => url.includes("/sellers/"))).toBe(false)
  })
})

describe("json-ld", () => {
  test("builds a product AggregateOffer", () => {
    const jsonLd = buildProductJsonLd({
      product: {
        title: "Wool coat",
        handle: "wool-coat",
        description: "<p>Warm</p>",
        thumbnail: "https://cdn.example/coat.jpg",
        images: [],
      },
      canonical: "https://shop.example/us/products/wool-coat",
      offers: [
        {
          id: "off_1",
          calculated_price: {
            calculated_amount: 120,
            currency_code: "usd",
          },
          inventory_quantity: 3,
        } as never,
        {
          id: "off_2",
          calculated_price: {
            calculated_amount: 90,
            currency_code: "usd",
          },
          inventory_quantity: 0,
        } as never,
      ],
    })

    expect(jsonLd["@type"]).toBe("Product")
    expect(jsonLd.description).toBe("Warm")
    expect(jsonLd.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: 90,
      highPrice: 120,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    })
  })

  test("builds a seller Organization", () => {
    const jsonLd = buildSellerJsonLd({
      name: "Acme",
      canonical: "https://shop.example/us/sellers/acme",
      description: "Handmade goods",
      logo: "https://cdn.example/acme.png",
    })
    expect(jsonLd).toMatchObject({
      "@type": "Organization",
      name: "Acme",
      logo: "https://cdn.example/acme.png",
    })
  })

  test("escapes HTML in serialized JSON-LD", () => {
    expect(serializeJsonLd({ name: "</script>" })).toContain("\\u003c")
  })
})
