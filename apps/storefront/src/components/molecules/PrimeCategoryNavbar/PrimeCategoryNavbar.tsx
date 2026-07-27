"use client"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"
import { primeCategories } from "@/data/categories"

export const PrimeCategoryNavbar = () => {
  const { category } = useParams()

  return (
    <div className="flex items-center gap-2">
      {Object.keys(primeCategories).map((key: string) => (
        <LocalizedClientLink
          key={key}
          href={`/${key}`}
          className={cn(
            "uppercase label-lg px-2 pb-1",
            key === category && "border-b border-primary"
          )}
        >
          {primeCategories[key as keyof typeof primeCategories]}
        </LocalizedClientLink>
      ))}
    </div>
  )
}
