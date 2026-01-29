import { PencilSquare } from "@medusajs/icons"
import { AdminStore } from "@medusajs/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { Link } from "react-router-dom"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useSalesChannel, useStockLocation } from "../../../../../hooks/api"
import { useRegion } from "../../../../../hooks/api/regions"

type StoreGeneralSectionProps = {
  store: AdminStore
}

export const StoreGeneralSection = ({ store }: StoreGeneralSectionProps) => {
  const { t } = useTranslation()

  const { region } = useRegion(store.default_region_id!, undefined, {
    enabled: !!store.default_region_id,
  })

  const defaultCurrency = store.supported_currencies?.find((c) => c.is_default)

  const { sales_channel } = useSalesChannel(store.default_sales_channel_id!, {
    enabled: !!store.default_sales_channel_id,
  })

  const { stock_location } = useStockLocation(
    store.default_location_id!,
    {
      fields: "id,name",
    },
    {
      enabled: !!store.default_location_id,
    }
  )

  return (
    <Container className="divide-y p-0" data-testid="store-general-section-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="store-general-section-header">
        <div>
          <Heading data-testid="store-general-section-heading">{t("store.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small" data-testid="store-general-section-subtitle">
            {t("store.manageYourStoresDetails")}
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
          data-testid="store-general-section-action-menu"
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4" data-testid="store-general-section-name">
        <Text size="small" leading="compact" weight="plus" data-testid="store-general-section-name-label">
          {t("fields.name")}
        </Text>
        <Text size="small" leading="compact" data-testid="store-general-section-name-value">
          {store.name}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4" data-testid="store-general-section-currency">
        <Text size="small" leading="compact" weight="plus" data-testid="store-general-section-currency-label">
          {t("store.defaultCurrency")}
        </Text>
        {defaultCurrency ? (
          <div className="flex items-center gap-x-2" data-testid="store-general-section-currency-value">
            <Badge size="2xsmall" data-testid="store-general-section-currency-badge">
              {defaultCurrency.currency_code?.toUpperCase()}
            </Badge>
            <Text size="small" leading="compact" data-testid="store-general-section-currency-name">
              {defaultCurrency.currency?.name}
            </Text>
          </div>
        ) : (
          <Text size="small" leading="compact" data-testid="store-general-section-currency-value">
            -
          </Text>
        )}
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4" data-testid="store-general-section-region">
        <Text size="small" leading="compact" weight="plus" data-testid="store-general-section-region-label">
          {t("store.defaultRegion")}
        </Text>
        <div className="flex items-center gap-x-2" data-testid="store-general-section-region-value">
          {region ? (
            <Badge size="2xsmall" asChild>
              <Link to={`/settings/regions/${region.id}`} data-testid="store-general-section-region-link">{region.name}</Link>
            </Badge>
          ) : (
            <Text size="small" leading="compact">
              -
            </Text>
          )}
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4" data-testid="store-general-section-sales-channel">
        <Text size="small" leading="compact" weight="plus" data-testid="store-general-section-sales-channel-label">
          {t("store.defaultSalesChannel")}
        </Text>
        <div className="flex items-center gap-x-2" data-testid="store-general-section-sales-channel-value">
          {sales_channel ? (
            <Badge size="2xsmall" asChild>
              <Link to={`/settings/sales-channels/${sales_channel.id}`} data-testid="store-general-section-sales-channel-link">
                {sales_channel.name}
              </Link>
            </Badge>
          ) : (
            <Text size="small" leading="compact">
              -
            </Text>
          )}
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4" data-testid="store-general-section-location">
        <Text size="small" leading="compact" weight="plus" data-testid="store-general-section-location-label">
          {t("store.defaultLocation")}
        </Text>
        <div className="flex items-center gap-x-2" data-testid="store-general-section-location-value">
          {stock_location ? (
            <Badge size="2xsmall" asChild>
              <Link to={`/settings/locations/${stock_location.id}`} data-testid="store-general-section-location-link">
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
