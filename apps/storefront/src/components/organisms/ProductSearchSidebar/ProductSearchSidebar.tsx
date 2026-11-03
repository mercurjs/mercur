"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/atoms/Button/Button"
import { Checkbox } from "@/components/atoms/Checkbox/Checkbox"
import { Accordion } from "@/components/molecules/Accordion/Accordion"
import { Modal } from "@/components/molecules/Modal/Modal"
import type { FacetValue, ListingFacets } from "@/lib/data/search"
import { isValueActive, toggleValueHref } from "@/lib/helpers/listing-params"
import { cn } from "@/lib/utils"

import { ProductListingActiveFilters } from "../ProductListingActiveFilters/ProductListingActiveFilters"
import { FilterOptionLink } from "./FilterOptionLink"
import { PriceFilter } from "./PriceFilter"
import { usePublishedListing } from "@/components/sections/ProductListing/ListingFacetsStore"

export const ProductSearchSidebar = ({
  fallback,
}: {
  fallback?: ListingFacets
}) => {
  const published = usePublishedListing()
  const facets = published?.facets ?? fallback
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  if (!facets) {
    return <SidebarSkeleton />
  }

  const filters = <FilterSections facets={facets} />

  return isMobile ? (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full uppercase mb-4"
        data-testid="filters-open-button"
      >
        Filters
      </Button>
      {isOpen && (
        <Modal heading="Filters" onClose={() => setIsOpen(false)}>
          <div className="px-4">
            <ProductListingActiveFilters />
            {filters}
          </div>
        </Modal>
      )}
    </>
  ) : (
    <div data-testid="product-listing-filters">{filters}</div>
  )
}

const FilterSections = ({ facets }: { facets: ListingFacets }) => {
  const searchParams = useSearchParams()

  return (
    <>
      {facets.price && (
        <PriceFilter
          bounds={facets.price}
          defaultOpen={Boolean(
            searchParams.get("min_price") || searchParams.get("max_price")
          )}
        />
      )}
      {facets.sellers.length > 0 && (
        <Accordion
          heading="Sellers"
          defaultOpen={Boolean(searchParams.get("seller"))}
        >
          <ul className="px-4" data-testid="filter-seller-options">
            {facets.sellers.map((seller) => (
              <li key={seller.value} className="mb-4">
                <CheckboxOption
                  paramKey="seller"
                  option={seller}
                  testId={`filter-seller-${seller.value}`}
                />
              </li>
            ))}
          </ul>
        </Accordion>
      )}
      {facets.attributes.map((attribute) => (
        <AttributeFilter
          key={attribute.handle}
          handle={attribute.handle}
          name={attribute.name}
          values={attribute.values}
          defaultOpen={Boolean(searchParams.get(attribute.handle))}
        />
      ))}
    </>
  )
}

const AttributeFilter = ({
  handle,
  name,
  values,
  defaultOpen,
}: {
  handle: string
  name: string
  values: FacetValue[]
  defaultOpen: boolean
}) => {
  const searchParams = useSearchParams()

  if (handle === "size") {
    return (
      <Accordion heading={name} defaultOpen={defaultOpen}>
        <ul className="grid grid-cols-4 mt-2 gap-2" data-testid="filter-size-options">
          {values.map((option) => {
            const selected = isValueActive(searchParams, handle, option.value)
            return (
              <li key={option.value} className="mb-4">
                <FilterOptionLink
                  href={toggleValueHref(searchParams, handle, option.value)}
                  selected={selected}
                  disabled={option.count === 0 && !selected}
                  aria-label={`Filter by ${name}: ${option.label}`}
                  className={cn(
                    "chip-wrapper w-full !justify-center !py-2 !font-normal",
                    selected && "border-primary"
                  )}
                  data-testid={`filter-size-${option.value}`}
                >
                  {option.label}
                </FilterOptionLink>
              </li>
            )
          })}
        </ul>
      </Accordion>
    )
  }

  return (
    <Accordion heading={name} defaultOpen={defaultOpen}>
      <ul className="px-4" data-testid={`filter-${handle}-options`}>
        {values.map((option) => (
          <li key={option.value} className="mb-4 flex items-center justify-between">
            <CheckboxOption
              paramKey={handle}
              option={option}
              label={`Filter by ${name}: ${option.label}`}
              testId={`filter-${handle}-${option.value}`}
            />
            {handle === "color" && (
              <span
                aria-hidden="true"
                style={{ backgroundColor: option.value.toLowerCase() }}
                className="w-5 h-5 border border-primary rounded-xs"
              />
            )}
          </li>
        ))}
      </ul>
    </Accordion>
  )
}

const CheckboxOption = ({
  paramKey,
  option,
  label,
  testId,
}: {
  paramKey: string
  option: FacetValue
  label?: string
  testId: string
}) => {
  const searchParams = useSearchParams()
  const selected = isValueActive(searchParams, paramKey, option.value)
  const disabled = option.count === 0 && !selected

  return (
    <FilterOptionLink
      href={toggleValueHref(searchParams, paramKey, option.value)}
      selected={selected}
      disabled={disabled}
      aria-label={label ?? `Filter by ${option.label}`}
      className="gap-4"
      data-testid={testId}
    >
      <Checkbox checked={selected} disabled={disabled} readOnly tabIndex={-1} />
      <span
        className={cn(
          "label-md !font-normal",
          selected && "!font-semibold",
          disabled && "text-disabled"
        )}
      >
        {option.label}{" "}
        <span className="label-sm !font-light">({option.count})</span>
      </span>
    </FilterOptionLink>
  )
}

const SidebarSkeleton = () => (
  <div aria-busy="true" className="flex flex-col gap-4" data-testid="product-listing-filters-skeleton">
    {Array.from({ length: 4 }, (_, index) => (
      <div key={index} className="h-14 animate-pulse rounded-sm bg-secondary" />
    ))}
  </div>
)
