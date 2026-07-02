import Image from "next/image"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowRightIcon } from "@/icons"
import { listCollections } from "@/lib/data/collections"

type MediaImage = { url: string; is_thumbnail?: boolean | null }

export async function ShopByStyleSection() {
  const { collections } = await listCollections()

  if (!collections?.length) {
    return null
  }

  return (
    <section className="bg-primary container">
      <h2 className="heading-lg text-primary mb-12">SHOP BY COLLECTION</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => {
          const media =
            (collection as unknown as { media_images?: MediaImage[] | null })
              .media_images ?? []
          const imageUrl =
            (media.find((m) => m.is_thumbnail) ?? media[0])?.url ||
            "/images/placeholder.svg"

          return (
            <LocalizedClientLink
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="group flex flex-col border rounded-sm bg-component overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  loading="lazy"
                  src={imageUrl}
                  alt={collection.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="label-lg text-primary uppercase">
                  {collection.title}
                </span>
                <ArrowRightIcon className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </div>
            </LocalizedClientLink>
          )
        })}
      </div>
    </section>
  )
}
