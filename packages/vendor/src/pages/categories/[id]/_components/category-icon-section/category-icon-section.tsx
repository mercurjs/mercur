import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import {
  CategoryWithImages,
  getCategoryIcon,
} from "../../../common/components/category-image-fields"

type CategoryIconSectionProps = {
  category: HttpTypes.AdminProductCategory & CategoryWithImages
}

export const CategoryIconSection = ({
  category,
}: CategoryIconSectionProps) => {
  const { t } = useTranslation()

  const icon = getCategoryIcon(category.media_images)

  return (
    <Container className="divide-y p-0" data-testid="category-icon-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t("categories.icon.label")}</Heading>
      </div>
      <div className="px-6 py-4">
        {icon ? (
          <div className="bg-ui-bg-base shadow-elevation-card-rest relative aspect-square w-24 overflow-hidden rounded-[8px]">
            <img
              src={icon.url}
              alt=""
              className="size-full object-contain object-center p-2"
              data-testid="category-icon-section-image"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-y-1 py-8">
            <Text
              size="small"
              leading="compact"
              weight="plus"
              className="text-ui-fg-subtle"
            >
              {t("categories.icon.empty.header")}
            </Text>
            <Text size="small" className="text-ui-fg-muted">
              {t("categories.icon.empty.description")}
            </Text>
          </div>
        )}
      </div>
      <DisplayExtensionZone model="category" zone="icon" data={category} />
    </Container>
  )
}
