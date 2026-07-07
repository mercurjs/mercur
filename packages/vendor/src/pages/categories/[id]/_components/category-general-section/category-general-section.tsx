import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
type CategoryGeneralSectionProps = {
  category: HttpTypes.AdminProductCategory
}

const GENERAL_FIELD_IDS = ["name", "description", "handle"]

export const CategoryGeneralSection = ({
  category,
}: CategoryGeneralSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <DisplayField model="category" zone="general" id="name" data={category}>
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>{category.name}</Heading>
        </div>
      </DisplayField>
      <DisplayField
        model="category"
        zone="general"
        id="description"
        data={category}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 gap-3 px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.description")}
          </Text>
          <Text size="small" leading="compact">
            {category.description || "-"}
          </Text>
        </div>
      </DisplayField>
      <DisplayField
        model="category"
        zone="general"
        id="handle"
        data={category}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 gap-3 px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.handle")}
          </Text>
          <Text size="small" leading="compact">
            /{category.handle}
          </Text>
        </div>
      </DisplayField>
      <DisplayExtensionZone
        model="category"
        zone="general"
        data={category}
        builtInFieldIds={GENERAL_FIELD_IDS}
      />
    </Container>
  )
}
