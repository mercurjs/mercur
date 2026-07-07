import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteProductCategoryAction } from "../../../common/hooks/use-delete-product-category-action"
import { getIsActiveProps, getIsInternalProps } from "../../../common/utils"

type CategoryGeneralSectionProps = {
  category: HttpTypes.AdminProductCategory
}

export const CategoryGeneralSection = ({
  category,
}: CategoryGeneralSectionProps) => {
  const { t } = useTranslation()

  const activeProps = getIsActiveProps(category.is_active, t)
  const internalProps = getIsInternalProps(category.is_internal, t)

  const handleDelete = useDeleteProductCategoryAction(category)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <DisplayField model="category" zone="general" id="name" data={category}>
          <Heading>{category.name}</Heading>
        </DisplayField>
        <div className="flex items-center gap-x-4">
          <div className="flex items-center gap-x-2">
            <DisplayField
              model="category"
              zone="general"
              id="is_active"
              data={category}
            >
              <StatusBadge color={activeProps.color}>
                {activeProps.label}
              </StatusBadge>
            </DisplayField>
            <DisplayField
              model="category"
              zone="general"
              id="is_internal"
              data={category}
            >
              <StatusBadge color={internalProps.color}>
                {internalProps.label}
              </StatusBadge>
            </DisplayField>
          </div>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    icon: <PencilSquare />,
                    to: "edit",
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    icon: <Trash />,
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
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
        builtInFieldIds={["name", "is_active", "is_internal", "description", "handle"]}
      />
    </Container>
  )
}
