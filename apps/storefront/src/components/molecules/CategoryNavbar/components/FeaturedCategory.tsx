import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import LocalizedClientLink from "../../LocalizedLink/LocalizedLink"
import { ArrowRightIcon } from "@/icons"
interface Props {
  category: HttpTypes.StoreProductCategory
  onLinkClick?: () => void
}

export const FeaturedCategory = ({ category, onLinkClick }: Props) => {

  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      onClick={onLinkClick}
      className="flex flex-col w-full h-full"
    >
      <div className="relative aspect-square max-h-[248px] w-full h-full bg-initial rounded-t-sm">
        {category && category.metadata && (
          <Image
            src={category.metadata?.image_url as string}
            alt={category.name}
            width={100}
            height={100}
            className="object-cover p-1 rounded-sm w-full h-full"
          />
        )}
      </div>

        <div className="p-4 flex flex-col gap-y-2 mt-auto bg-initial">
          <h3 className="heading-md text-primary uppercase">{category.name}</h3>
          <div className="flex items-center gap-x-2">
            <p className="label-md uppercase">Shop Now</p>
            <ArrowRightIcon className="w-4 h-4" />
          </div>
        </div>
    </LocalizedClientLink>
  )
}
