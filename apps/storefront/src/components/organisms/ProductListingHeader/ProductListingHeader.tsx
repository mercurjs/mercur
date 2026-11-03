"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { SelectField } from "@/components/molecules/SelectField/SelectField"
import { usePublishedListing } from "@/components/sections/ProductListing/ListingFacetsStore"
import {
  LISTING_SORT_OPTIONS,
  parseListingParams,
  withSortHref,
} from "@/lib/helpers/listing-params"
import type { SortOptions } from "@/types/product"

export const ProductListingHeader = ({ total }: { total?: number }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const published = usePublishedListing()
  const [isPending, startTransition] = useTransition()

  const { sortBy } = parseListingParams(searchParams)
  const count = total ?? published?.count

  const selectSort = (value: string) => {
    startTransition(() => {
      router.push(`${pathname}${withSortHref(searchParams, value as SortOptions)}`, {
        scroll: false,
      })
    })
  }

  return (
    <div
      className="flex w-full items-center justify-between gap-4 my-4"
      data-testid="product-listing-header"
      aria-busy={isPending}
    >
      <div className="label-md" data-testid="product-listing-count">
        {count === undefined ? "" : `${count} listings`}
      </div>
      <div className="w-[200px]" data-testid="product-listing-sort">
        <SelectField
          key={sortBy}
          options={LISTING_SORT_OPTIONS}
          selected={sortBy}
          selectOption={selectSort}
          className={isPending ? "opacity-60" : ""}
        />
      </div>
    </div>
  )
}
