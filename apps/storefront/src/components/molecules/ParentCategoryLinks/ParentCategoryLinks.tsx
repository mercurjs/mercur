"use client"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { getActiveParentHandle } from "@/lib/helpers/category-utils"

interface ParentCategoryLinksProps {
  parentCategories: HttpTypes.StoreProductCategory[]
  categories: HttpTypes.StoreProductCategory[]
}

export const ParentCategoryLinks = ({
  parentCategories,
  categories,
}: ParentCategoryLinksProps) => {
  const { category } = useParams<{ category?: string }>()

  const activeParentHandle = useMemo(
    () => getActiveParentHandle(category, categories, parentCategories),
    [category, categories, parentCategories]
  )

  return (
    <nav
      className="hidden lg:flex items-center gap-4"
      aria-label="Parent categories"
    >
      {parentCategories.map(({ id, handle, name }) => {
        const isActive = handle === activeParentHandle

        return (
          <LocalizedClientLink
            key={id}
            href={`/categories/${handle}`}
            className={cn(
              "label-large uppercase text-primary hover:opacity-80 transition-opacity pb-2 font-semibold",
              isActive && "border-b border-primary"
            )}
          >
            {name}
          </LocalizedClientLink>
        )
      })}
    </nav>
  )
}
