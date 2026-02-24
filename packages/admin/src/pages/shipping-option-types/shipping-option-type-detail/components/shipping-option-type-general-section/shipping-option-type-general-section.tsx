import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteShippingOptionTypeAction } from "../../../common/hooks/use-delete-shipping-option-type-action"

type ShippingOptionTypeGeneralSectionProps = {
  shippingOptionType: HttpTypes.AdminShippingOptionType
}

export const ShippingOptionTypeGeneralSection = ({
  shippingOptionType,
}: ShippingOptionTypeGeneralSectionProps) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteShippingOptionTypeAction(
    shippingOptionType.id,
    shippingOptionType.label
  )

  return (
    <Container className="divide-y p-0" data-testid="shipping-option-type-general-section-container">
      <div className="flex items-center justify-between  px-6 py-4" data-testid="shipping-option-type-general-section-header">
        <Heading data-testid="shipping-option-type-general-section-heading">{shippingOptionType.label}</Heading>
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
          data-testid="shipping-option-type-general-section-action-menu"
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4" data-testid="shipping-option-type-general-section-code-row">
        <Text size="small" leading="compact" weight="plus" data-testid="shipping-option-type-general-section-code-label">
          {t("fields.code")}
        </Text>
        <Text size="small" leading="compact" data-testid="shipping-option-type-general-section-code-value">
          {shippingOptionType.code}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4" data-testid="shipping-option-type-general-section-description-row">
        <Text size="small" leading="compact" weight="plus" data-testid="shipping-option-type-general-section-description-label">
          {t("fields.description")}
        </Text>
        <Text size="small" leading="compact" data-testid="shipping-option-type-general-section-description-value">
          {shippingOptionType.description || "-"}
        </Text>
      </div>
    </Container>
  )
}
