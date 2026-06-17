import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
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

  const gallery = getCategoryGallery(category.images)

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
          <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
            {gallery.map((image) => (
              <div
                key={image.id}
                className="shadow-elevation-card-rest relative aspect-square overflow-hidden rounded-lg"
                data-testid={`category-media-section-item-${image.id}`}
              >
                <img
                  src={image.url}
                  alt=""
                  className="size-full object-cover object-center"
                />
                {(image.is_thumbnail || image.is_banner) && (
                  <div className="absolute left-1 top-1 flex items-center gap-x-1">
                    {image.is_thumbnail && (
                      <Badge size="2xsmall" color="green">
                        {t("categories.media.thumbnail")}
                      </Badge>
                    )}
                    {image.is_banner && (
                      <Badge size="2xsmall" color="blue">
                        {t("categories.media.banner")}
                      </Badge>
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
    </Container>
  )
}
