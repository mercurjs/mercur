"use client"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { HttpTypes } from "@medusajs/types"
import { useParams } from "next/navigation"

export const HeadingCategories = ({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) => {
  const { category } = useParams()

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
