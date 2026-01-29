import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeletePriceListAction } from "../../../common/hooks/use-delete-price-list-action"
import { getPriceListStatus } from "../../../common/utils"

type PriceListGeneralSectionProps = {
  priceList: HttpTypes.AdminPriceList
}

export const PriceListGeneralSection = ({
  priceList,
}: PriceListGeneralSectionProps) => {
  const { t } = useTranslation()

  const overrideCount = priceList.prices?.length || 0

  const { color, text } = getPriceListStatus(t, priceList)

  const handleDelete = useDeletePriceListAction({ priceList })

  const type =
    priceList.type === "sale"
      ? t("priceLists.fields.type.options.sale.label")
      : t("priceLists.fields.type.options.override.label")

  return (
    <Container className="divide-y p-0" data-testid="price-list-general-section-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="price-list-general-section-header">
        <Heading data-testid="price-list-general-section-title">{priceList.title}</Heading>
        <div className="flex items-center gap-x-4">
          <StatusBadge color={color} data-testid="price-list-general-section-status">{text}</StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    to: "edit",
                    icon: <PencilSquare />,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    onClick: handleDelete,
                    icon: <Trash />,
                  },
                ],
              },
            ]}
            data-testid="price-list-general-section-action-menu"
          />
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="price-list-general-section-type">
        <Text leading="compact" size="small" weight="plus" data-testid="price-list-general-section-type-label">
          {t("fields.type")}
        </Text>
        <Text size="small" className="text-pretty" data-testid="price-list-general-section-type-value">
          {type}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="price-list-general-section-description">
        <Text leading="compact" size="small" weight="plus" data-testid="price-list-general-section-description-label">
          {t("fields.description")}
        </Text>
        <Text size="small" className="text-pretty" data-testid="price-list-general-section-description-value">
          {priceList.description}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="price-list-general-section-price-overrides">
        <Text leading="compact" size="small" weight="plus" data-testid="price-list-general-section-price-overrides-label">
          {t("priceLists.fields.priceOverrides.label")}
        </Text>
        <Text size="small" className="text-pretty" data-testid="price-list-general-section-price-overrides-value">
          {overrideCount || "-"}
        </Text>
      </div>
    </Container>
  )
}
