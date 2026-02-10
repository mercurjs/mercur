import { PencilSquare } from "@medusajs/icons"
import { AdminStore } from "@medusajs/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "@components/common/action-menu"
import { useRegion } from "@hooks/api/regions"
import { useStockLocation } from "@hooks/api"

type SellerGeneralSectionProps = {
  seller: AdminStore
}

export const SellerGeneralSection = ({ seller }: SellerGeneralSectionProps) => {
  const { t } = useTranslation()

  const { region } = useRegion(seller.default_region_id!, undefined, {
    enabled: !!seller.default_region_id,
  })

  const defaultCurrency = seller.supported_currencies?.find((c) => c.is_default)

  const { stock_location } = useStockLocation(
    seller.default_location_id!,
    {
      fields: "id,name",
    },
    {
      enabled: !!seller.default_location_id,
    }
  )

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("seller.domain", "Seller")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("seller.manageDetails", "Manage your seller details")}
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: "edit",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.name")}
        </Text>
        <Text size="small" leading="compact">
          {seller.name}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("seller.defaultCurrency", "Default Currency")}
        </Text>
        {defaultCurrency ? (
          <div className="flex items-center gap-x-2">
            <Badge size="2xsmall">
              {defaultCurrency.currency_code?.toUpperCase()}
            </Badge>
            <Text size="small" leading="compact">
              {defaultCurrency.currency?.name}
            </Text>
          </div>
        ) : (
          <Text size="small" leading="compact">
            -
          </Text>
        )}
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("seller.defaultRegion", "Default Region")}
        </Text>
        <div className="flex items-center gap-x-2">
          {region ? (
            <Badge size="2xsmall" asChild>
              <Link to={`/settings/regions/${region.id}`}>{region.name}</Link>
            </Badge>
          ) : (
            <Text size="small" leading="compact">
              -
            </Text>
          )}
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("seller.defaultLocation", "Default Location")}
        </Text>
        <div className="flex items-center gap-x-2">
          {stock_location ? (
            <Badge size="2xsmall" asChild>
              <Link to={`/settings/locations/${stock_location.id}`}>
                {stock_location.name}
              </Link>
            </Badge>
          ) : (
            <Text size="small" leading="compact">
              -
            </Text>
          )}
        </div>
      </div>
    </Container>
  )
}
