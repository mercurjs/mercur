"use client"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { Button } from '@/components/atoms/Button/Button';
import { ActiveCategory } from "@/components/molecules/ActiveCategory/ActiveCategory"
import { useMemo } from "react"
import { getActiveParentHandle } from "@/lib/helpers/category-utils"

const HeaderCategoryNavbarView = ({
  category,
  parentCategories,
  categories,
  onClose,
}: {
  parentCategories: HttpTypes.StoreProductCategory[]
  categories: HttpTypes.StoreProductCategory[]
  onClose?: (state: boolean) => void
} & { category?: string }) => {
  const activeParentHandle = useMemo(
    () => getActiveParentHandle(category, categories, parentCategories),
    [category, categories, parentCategories]
  )

  return (
    <nav
      className="flex items-center p-4 gap-2 overflow-x-auto scrollbar-hide"
      aria-label="Parent categories"
    >
      {parentCategories?.map(({ id, handle, name }) => {
        const isActive = handle === activeParentHandle
        return (
          <LocalizedClientLink
            key={id}
            href={`/categories/${handle}`}
            onClick={() => (onClose ? onClose(false) : null)}
            className={cn(
              "label-large uppercase text-primary hover:opacity-80 transition-opacity py-2 font-semibold px-8",
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

export const HeaderCategoryNavbar = (props: {
  parentCategories: HttpTypes.StoreProductCategory[]
  categories: HttpTypes.StoreProductCategory[]
  onClose?: (state: boolean) => void
}) => (
  <ActiveCategory fallback={<HeaderCategoryNavbarView {...props} />}>
    {(category) => <HeaderCategoryNavbarView {...props} category={category} />}
  </ActiveCategory>
)
