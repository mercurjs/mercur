"use client"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"
import { CollapseIcon } from "@/icons"
import { useMemo, useState } from "react"
import {
  getActiveParentHandle,
  findParentCategoryHandle,
  filterCategoriesByParent,
} from "@/lib/helpers/category-utils"
import { MobileCategoryDrawer } from "./MobileCategoryDrawer"

interface MobileCategoryNavbarProps {
  categories: HttpTypes.StoreProductCategory[]
  parentCategories?: HttpTypes.StoreProductCategory[]
  onClose?: (state: boolean) => void
}

export const MobileCategoryNavbar = ({
  categories,
  parentCategories = [],
  onClose,
}: MobileCategoryNavbarProps) => {
  const { category } = useParams<{ category?: string }>()
  const [selectedCategory, setSelectedCategory] = useState<HttpTypes.StoreProductCategory | null>(null)

  const activeParentHandle = useMemo(
    () => getActiveParentHandle(category, categories, parentCategories),
    [category, parentCategories, categories]
  )

  const parentCategoryHandle = useMemo(
    () => findParentCategoryHandle(category, categories),
    [category, categories]
  )

  const filteredCategories = useMemo(
    () =>
      filterCategoriesByParent(
        activeParentHandle,
        categories,
        parentCategories
      ),
    [activeParentHandle, parentCategories, categories]
  )

  const handleClose = () => {
    onClose?.(false)
  }

  const handleCategoryClick = (categoryId: string) => {
    const cat = filteredCategories.find((c) => c.id === categoryId)
    if (cat && cat.category_children && cat.category_children.length > 0) {
      setSelectedCategory(cat)
    }
  }

  const handleDrawerClose = () => {
    setSelectedCategory(null)
  }

  return (
    <>
      <nav
        className="flex flex-col gap-2"
        aria-label="Mobile category navigation"
      >
        <LocalizedClientLink
          href="/categories"
          onClick={handleClose}
          className="label-md uppercase px-4 py-3 text-primary hover:bg-secondary/10 transition-colors"
        >
          All Products
        </LocalizedClientLink>

        {filteredCategories.map(({ id, handle, name, category_children }) => {
          const categoryUrl = `/categories/${handle}`
          const isActive = handle === category || handle === parentCategoryHandle
          const hasChildren = category_children && category_children.length > 0

          return (
            <div key={id} className="relative">
              <div className="flex items-center justify-between">
                <LocalizedClientLink
                  href={categoryUrl}
                  onClick={handleClose}
                  className={cn(
                    "label-md uppercase px-4 py-3 text-primary hover:bg-secondary/10 transition-colors flex-1",
                    isActive && "border-l-2 border-primary bg-secondary/5"
                  )}
                >
                  {name}
                </LocalizedClientLink>
                
                {hasChildren && (
                  <button
                    onClick={() => handleCategoryClick(id)}
                    className="px-4 py-3 hover:bg-secondary/10 transition-colors"
                    aria-label={`View ${name} subcategories`}
                  >
                    <CollapseIcon size={18} className="-rotate-90" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </nav>

      {selectedCategory && (
        <MobileCategoryDrawer
          category={selectedCategory}
          isOpen={!!selectedCategory}
          onClose={handleDrawerClose}
          onLinkClick={handleClose}
        />
      )}
    </>
  )
}
