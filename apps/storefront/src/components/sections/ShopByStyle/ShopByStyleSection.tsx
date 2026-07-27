import Image from "next/image"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowRightIcon } from "@/icons"
import { Style } from "@/types/styles"

export const styles: Style[] = [
  {
    id: 1,
    name: "LUXURY",
    href: "/collections/luxury",
  },
  {
    id: 2,
    name: "VINTAGE",
    href: "/collections/vintage",
  },
  {
    id: 3,
    name: "CASUAL",
    href: "/collections/casual",
  },
  {
    id: 4,
    name: "STREETWEAR",
    href: "/collections/streetwear",
  },
  {
    id: 5,
    name: "Y2K",
    href: "/collections/y2k",
  },
]

export function ShopByStyleSection() {
  return (
    <section className="bg-primary container">
      <h2 className="heading-lg text-primary mb-12">SHOP BY STYLE</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center">
        <div className="py-[52px] px-[58px] h-full border rounded-sm">
          {styles.map((style) => (
            <LocalizedClientLink
              key={style.id}
              href={style.href}
              className="group flex items-center gap-4 text-primary hover:text-action transition-colors border-b border-transparent hover:border-primary w-fit pb-2 mb-8"
            >
              <span className="heading-lg">{style.name}</span>
              <ArrowRightIcon className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </LocalizedClientLink>
          ))}
        </div>
        <div className="relative hidden lg:block">
          <Image
            loading="lazy"
            fetchPriority="high"
            src="/images/shop-by-styles/Image.jpg"
            alt="Models showcasing luxury fashion styles"
            width={700}
            height={600}
            className="object-cover rounded-sm w-full h-auto"
          />
        </div>
      </div>
    </section>
  )
}
