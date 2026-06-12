import { ThumbnailBadge } from "@medusajs/icons"
import { Container, Heading, Text, Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

type OfferMediaProduct = {
  title?: string | null
  thumbnail?: string | null
  images?: Array<{ id: string; url: string }> | null
}

type MediaItem = { id: string; url: string; isThumbnail: boolean }

const getMedia = (product: OfferMediaProduct): MediaItem[] => {
  const images = product.images ?? []
  const thumbnail = product.thumbnail

  const media: MediaItem[] = images.map((image) => ({
    id: image.id,
    url: image.url,
    isThumbnail: image.url === thumbnail,
  }))

  if (thumbnail && !media.some((m) => m.url === thumbnail)) {
    media.unshift({ id: "img_thumbnail", url: thumbnail, isThumbnail: true })
  }

  return media
}

/**
 * Read-only Media section of the offer detail. The product's media is
 * owned by the product (editable on the product page reachable via the
 * Associated product card), so the offer surface only displays it.
 */
export const OfferMediaSection = ({
  product,
}: {
  product: OfferMediaProduct
}) => {
  const { t } = useTranslation()
  const media = getMedia(product)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.media.label")}</Heading>
      </div>
      {media.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4 px-6 py-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="shadow-elevation-card-rest relative aspect-square size-full overflow-hidden rounded-[8px]"
            >
              {item.isThumbnail && (
                <div className="absolute left-2 top-2">
                  <Tooltip content={t("fields.thumbnail")}>
                    <ThumbnailBadge />
                  </Tooltip>
                </div>
              )}
              <img
                src={item.url}
                alt={product.title ?? ""}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-y-1 pb-8 pt-6">
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-subtle"
          >
            {t("products.media.emptyState.header")}
          </Text>
          <Text size="small" className="text-ui-fg-muted">
            {t("products.media.emptyState.description")}
          </Text>
        </div>
      )}
    </Container>
  )
}
