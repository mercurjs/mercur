"use client"

import { HttpTypes } from "@medusajs/types"
import { CategoryDropdownContainer } from "./CategoryDropdownContainer"
import { CategoryDropdownContent } from "./CategoryDropdownContent"
import { ChildCategories } from "./ChildCategories"
import { FeaturedCategory } from "./FeaturedCategory"

interface CategoryDropdownMenuProps {
  category: HttpTypes.StoreProductCategory
  isVisible: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onLinkClick?: () => void
}

export const CategoryDropdownMenu = ({
  category,
  isVisible,
  onMouseEnter,
  onMouseLeave,
  onLinkClick,
}: CategoryDropdownMenuProps) => {
  const childCategories = category.category_children || []

  if (childCategories.length === 0) {
    return null
  }

  return (
    <CategoryDropdownContainer
      isVisible={isVisible}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <CategoryDropdownContent>
        <div className="grid grid-cols-1 max-h-[22.5rem] h-full overflow-y-auto">
          <section className="border rounded-sm p-6">
            <ChildCategories
              title={category.name}
              categories={childCategories}
              onLinkClick={onLinkClick}
            />
          </section>
        </div>
      </CategoryDropdownContent>
    </CategoryDropdownContainer>
  )
}
