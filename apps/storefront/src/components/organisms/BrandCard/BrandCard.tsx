import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"
import { Brand } from "@/types/brands"

interface BrandCardProps {
  brand: Brand
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <LocalizedClientLink href={brand.href}>
      <div className="relative border border-secondary rounded-sm bg-action h-[320px] w-[320px] 2xl:h-[400px] 2xl:w-[400px] flex items-center justify-center hover:rounded-full transition-all duration-200">
        <Image
          src={decodeURIComponent(brand.logo)}
          alt={brand.name}
          fill
          className="object-contain brightness-0 invert"
        />
      </div>
    </LocalizedClientLink>
  )
}
