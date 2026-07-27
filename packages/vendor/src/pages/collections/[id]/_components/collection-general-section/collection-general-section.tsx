import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"

const GENERAL_FIELD_IDS = ["title", "handle"]

type CollectionGeneralSectionProps = {
  collection: HttpTypes.AdminCollection
}

export const CollectionGeneralSection = ({
  collection,
}: CollectionGeneralSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <DisplayField model="collection" zone="general" id="title" data={collection}>
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>{collection.title}</Heading>
        </div>
      </DisplayField>
      <DisplayField model="collection" zone="general" id="handle" data={collection}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.handle")}
          </Text>
          <Text size="small">/{collection.handle}</Text>
        </div>
      </DisplayField>
      <DisplayExtensionZone
        model="collection"
        zone="general"
        data={collection}
        builtInFieldIds={GENERAL_FIELD_IDS}
      />
    </Container>
  )
}
