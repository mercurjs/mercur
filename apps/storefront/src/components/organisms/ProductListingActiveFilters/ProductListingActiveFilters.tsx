"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { MouseEvent } from "react"

import { Chip } from "@/components/atoms/Chip/Chip"
import { usePublishedListing } from "@/components/sections/ProductListing/ListingFacetsStore"
import { CloseIcon } from "@/icons"
import type { ListingFacets } from "@/lib/data/search"
import {
  clearFiltersHref,
  parseListingParams,
  removeValueHref,
  withPriceHref,
} from "@/lib/helpers/listing-params"
import { convertToLocale } from "@/lib/helpers/money"

type Badge = { key: string; label: string; href: string }

const buildBadges = (
  searchParams: URLSearchParams,
  facets: ListingFacets | undefined
): Badge[] => {
  const params = parseListingParams(searchParams)
  const badges: Badge[] = []

  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const currency = facets?.price?.currency_code
    const format = (value: number) =>
      currency ? convertToLocale({ amount: value, currency_code: currency }) : String(value)
    const label =
      params.minPrice !== undefined && params.maxPrice !== undefined
        ? `${format(params.minPrice)} – ${format(params.maxPrice)}`
        : params.minPrice !== undefined
          ? `From ${format(params.minPrice)}`
          : `Up to ${format(params.maxPrice ?? 0)}`
    badges.push({ key: "price", label: `Price: ${label}`, href: withPriceHref(searchParams, null, null) })
  }

  for (const handle of params.sellers) {
    const seller = facets?.sellers.find((entry) => entry.value === handle)
    badges.push({
      key: `seller:${handle}`,
      label: `Seller: ${seller?.label ?? handle}`,
      href: removeValueHref(searchParams, "seller", handle),
    })
  }

  for (const [handle, values] of Object.entries(params.attributes)) {
    const attribute = facets?.attributes.find((entry) => entry.handle === handle)
    const name = attribute?.name ?? handle.charAt(0).toUpperCase() + handle.slice(1)
    for (const value of values) {
      badges.push({
        key: `${handle}:${value}`,
        label: `${name}: ${value}`,
        href: removeValueHref(searchParams, handle, value),
      })
    }
  }

  return badges
}

export const ProductListingActiveFilters = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const published = usePublishedListing()

  const badges = buildBadges(searchParams, published?.facets)
  if (!badges.length) {
    return null
  }

  const go = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    router.push(`${pathname}${href}`, { scroll: false })
  }

  return (
    <div className="gap-2 overflow-x-auto no-scrollbar flex items-center mb-4" data-testid="product-listing-active-filters">
      {badges.map((badge) => (
        <Link
          key={badge.key}
          href={`${pathname}${badge.href}`}
          scroll={false}
          onClick={go(badge.href)}
          aria-label={`Remove filter: ${badge.label}`}
          data-testid={`active-filter-${badge.key}`}
        >
          <Chip
            value={
              <span className="flex gap-2 items-center whitespace-nowrap">
                {badge.label}
                <CloseIcon size={16} />
              </span>
            }
          />
        </Link>
      ))}
      <Link
        href={`${pathname}${clearFiltersHref(searchParams)}`}
        scroll={false}
        onClick={go(clearFiltersHref(searchParams))}
        className="label-md underline whitespace-nowrap ml-2"
        data-testid="active-filters-clear"
      >
        Clear all
      </Link>
    </div>
  )
}
