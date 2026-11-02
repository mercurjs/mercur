"use client"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { HttpTypes } from "@medusajs/types"
import { ActiveCategory } from "@/components/molecules/ActiveCategory/ActiveCategory"

const HeadingCategoriesView = ({
  category,
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
} & { category?: string }) => {
  return (
    <nav className="hidden lg:flex space-x-2 items-center flex-col md:flex-row">
      {categories?.map(({ id, handle, name }) => (
        <LocalizedClientLink
          key={id}
          href={`/categories/${handle}`}
          className={cn(
            "label-md uppercase px-2 mb-4 md:mb-0",
            handle === category && "border-b border-primary"
          )}
        >
          {name}
        </LocalizedClientLink>
      ))}
    </nav>
  )
}

export const HeadingCategories = (props: {
  categories: HttpTypes.StoreProductCategory[]
}) => (
  <ActiveCategory fallback={<HeadingCategoriesView {...props} />}>
    {(category) => <HeadingCategoriesView {...props} category={category} />}
  </ActiveCategory>
)
