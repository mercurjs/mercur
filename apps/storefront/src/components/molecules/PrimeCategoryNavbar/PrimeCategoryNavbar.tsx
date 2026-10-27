"use client"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { ActiveCategory } from "@/components/molecules/ActiveCategory/ActiveCategory"
import { primeCategories } from "@/data/categories"

const PrimeCategoryNavbarView = ({ category }: { category?: string }) => {
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

export const PrimeCategoryNavbar = () => (
  <ActiveCategory fallback={<PrimeCategoryNavbarView />}>
    {(category) => <PrimeCategoryNavbarView category={category} />}
  </ActiveCategory>
)
