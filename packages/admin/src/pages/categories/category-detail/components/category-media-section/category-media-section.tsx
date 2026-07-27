import { PencilSquare, ThumbnailBadge } from "@medusajs/icons"
import { DisplayExtensionZone, ListBadge } from "@mercurjs/dashboard-shared"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text, Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import {
  CategoryWithImages,
  getCategoryGallery,
} from "../../../common/components/category-image-fields"

type CategoryMediaSectionProps = {
  category: HttpTypes.AdminProductCategory & CategoryWithImages
}

export const CategoryMediaSection = ({
  category,
}: CategoryMediaSectionProps) => {
  const { t } = useTranslation()

  const gallery = getCategoryGallery(category.media_images)

  return (
    <Container className="divide-y p-0" data-testid="category-media-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("categories.media.label")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "media?view=edit",
                },
              ],
            },
          ]}
          data-testid="category-media-section-menu"
        />
      </div>
      <div className="px-6 py-4">
        {gallery.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-4">
            {gallery.map((image) => (
              <div
                key={image.id}
                className="shadow-elevation-card-rest relative aspect-square size-full overflow-hidden rounded-[8px]"
                data-testid={`category-media-section-item-${image.id}`}
              >
                <img
                  src={image.url}
                  alt=""
                  className="size-full object-cover object-center"
                />
                {(image.is_thumbnail || image.is_banner) && (
                  <div className="absolute left-2 top-2 flex items-center gap-x-1">
                    {image.is_thumbnail && (
                      <Tooltip content={t("categories.media.thumbnail")}>
                        <ThumbnailBadge />
                      </Tooltip>
                    )}
                    {image.is_banner && (
                      <Tooltip content={t("categories.media.banner")}>
                        <ListBadge />
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-y-1 py-8">
            <Text
              size="small"
              leading="compact"
              weight="plus"
              className="text-ui-fg-subtle"
            >
              {t("categories.media.empty.header")}
            </Text>
            <Text size="small" className="text-ui-fg-muted">
              {t("categories.media.empty.description")}
            </Text>
          </div>
        )}
      </div>
      <DisplayExtensionZone model="category" zone="media" data={category} />
    </Container>
  )
}
