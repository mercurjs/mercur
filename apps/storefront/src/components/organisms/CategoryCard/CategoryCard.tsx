import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import Image from "next/image"

type MediaImage = { url: string; is_thumbnail?: boolean | null }

export function CategoryCard({
  category,
}: {
  category: {
    name: string
    handle: string
    media_images?: MediaImage[] | null
  }
}) {
  const media = category.media_images ?? []
  const imageUrl =
    (media.find((m) => m.is_thumbnail) ?? media[0])?.url ||
    `/images/categories/${category.handle}.png`

  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      className="relative flex flex-col items-center border rounded-sm bg-component transition-all hover:rounded-full w-[233px] aspect-square"
    >
      <div className="flex relative aspect-square overflow-hidden w-[200px]">
        <Image
          loading="lazy"
          src={imageUrl}
          alt={`category - ${category.name}`}
          width={200}
          height={200}
          sizes="(min-width: 1024px) 200px, 40vw"
          className="object-contain scale-90 rounded-full"
        />
      </div>
      <h3 className="w-full text-center label-lg text-primary">
        {category.name}
      </h3>
    </LocalizedClientLink>
  )
}
