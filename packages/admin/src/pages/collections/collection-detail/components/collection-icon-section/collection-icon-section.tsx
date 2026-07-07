import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import {
  CollectionWithImages,
  getCollectionIcon,
} from "../../../common/components/collection-image-fields"

type CollectionIconSectionProps = {
  collection: HttpTypes.AdminCollection & CollectionWithImages
}

export const CollectionIconSection = ({
  collection,
}: CollectionIconSectionProps) => {
  const { t } = useTranslation()

  const icon = getCollectionIcon(collection.media_images)

  return (
    <Container className="divide-y p-0" data-testid="collection-icon-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("collections.icon.label")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "icon/edit",
                },
              ],
            },
          ]}
          data-testid="collection-icon-section-menu"
        />
      </div>
      <div className="px-6 py-4">
        {icon ? (
          <div className="bg-ui-bg-base shadow-elevation-card-rest relative aspect-square w-24 overflow-hidden rounded-[8px]">
            <img
              src={icon.url}
              alt=""
              className="size-full object-contain object-center p-2"
              data-testid="collection-icon-section-image"
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
              {t("collections.icon.empty.header")}
            </Text>
            <Text size="small" className="text-ui-fg-muted">
              {t("collections.icon.empty.description")}
            </Text>
          </div>
        )}
      </div>
      <DisplayExtensionZone model="collection" zone="icon" data={collection} />
    </Container>
  )
}
