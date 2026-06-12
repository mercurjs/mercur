import { ThumbnailBadge } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"

type Media = {
  id: string
  url: string
  isThumbnail: boolean
}

const getMedia = (product: HttpTypes.AdminProduct): Media[] => {
  const images = product.images ?? []
  const thumbnail = product.thumbnail

  const media: Media[] = images.map((image) => ({
    id: image.id!,
    url: image.url,
    isThumbnail: image.url === thumbnail,
  }))

  if (thumbnail && !media.some((m) => m.isThumbnail)) {
    media.unshift({ id: "thumbnail", url: thumbnail, isThumbnail: true })
  }

  return media
}

/**
 * Read-only product media grid for the admin offer detail (SPEC-010).
 * Admin operators inspect offers, so the media section has no edit /
 * select / delete affordances (unlike the editable product detail one).
 */
export const OfferMediaSection = ({
  product,
}: {
  product: HttpTypes.AdminProduct
}) => {
  const { t } = useTranslation()
  const media = getMedia(product)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.media.label")}</Heading>
      </div>

      {media.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-y-2 px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            {t("products.media.emptyState.description")}
          </Text>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4 px-6 py-4">
          {media.map((m) => (
            <div
              key={m.id}
              className={clx(
                "shadow-elevation-card-rest relative aspect-square overflow-hidden rounded-lg",
              )}
            >
              {m.isThumbnail && (
                <div className="absolute left-2 top-2">
                  <ThumbnailBadge />
                </div>
              )}
              <img
                src={m.url}
                alt=""
                className="size-full object-cover object-center"
              />
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}
