import { Channels, PencilSquare } from "@medusajs/icons"
import { Container, Heading, Text, Tooltip } from "@medusajs/ui"
import { Trans, useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useSalesChannels } from "../../../../../hooks/api/sales-channels"
import { HttpTypes } from "@medusajs/types"

type ProductSalesChannelSectionProps = {
  product: HttpTypes.AdminProduct
}

// TODO: The fetched sales channel doesn't contain all necessary info
export const ProductSalesChannelSection = ({
  product,
}: ProductSalesChannelSectionProps) => {
  const { count } = useSalesChannels()
  const { t } = useTranslation()

  const availableInSalesChannels =
    product.sales_channels?.map((sc) => ({
      id: sc.id,
      name: sc.name,
    })) ?? []

  const firstChannels = availableInSalesChannels.slice(0, 3)
  const restChannels = availableInSalesChannels.slice(3)

  return (
    <Container className="flex flex-col gap-y-4 px-6 py-4" data-testid="product-sales-channel-section">
      <div className="flex items-center justify-between" data-testid="product-sales-channel-header">
        <Heading level="h2" data-testid="product-sales-channel-title">{t("fields.sales_channels")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "sales-channels",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
          data-testid="product-sales-channel-action-menu"
        />
      </div>
      <div className="grid grid-cols-[28px_1fr] items-center gap-x-3" data-testid="product-sales-channels-content">
        <div className="bg-ui-bg-base shadow-borders-base flex size-7 items-center justify-center rounded-md" data-testid="product-sales-channels-icon-container">
          <div className="bg-ui-bg-component flex size-6 items-center justify-center rounded-[4px]">
            <Channels className="text-ui-fg-subtle" data-testid="product-sales-channels-icon" />
          </div>
        </div>
        {availableInSalesChannels.length > 0 ? (
          <div className="flex items-center gap-x-1" data-testid="product-sales-channels-list">
            <Text size="small" leading="compact" data-testid="product-sales-channels-names">
              {firstChannels.map((sc) => sc.name).join(", ")}
            </Text>
            {restChannels.length > 0 && (
              <Tooltip
                content={
                  <ul>
                    {restChannels.map((sc) => (
                      <li key={sc.id}>{sc.name}</li>
                    ))}
                  </ul>
                }
                data-testid="product-sales-channels-more-tooltip"
              >
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                  data-testid="product-sales-channels-more-count"
                >
                  {`+${restChannels.length}`}
                </Text>
              </Tooltip>
            )}
          </div>
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-subtle" data-testid="product-sales-channels-empty">
            {t("products.noSalesChannels")}
          </Text>
        )}
      </div>
      <div data-testid="product-sales-channels-stats">
        <Text className="text-ui-fg-subtle" size="small" leading="compact" data-testid="product-sales-channels-stats-text">
          <Trans
            i18nKey="sales_channels.availableIn"
            values={{
              x: availableInSalesChannels.length,
              y: count ?? 0,
            }}
            components={[
              <span
                key="x"
                className="text-ui-fg-base txt-compact-medium-plus"
                data-testid="product-sales-channels-count"
              />,
              <span
                key="y"
                className="text-ui-fg-base txt-compact-medium-plus"
                data-testid="product-sales-channels-total"
              />,
            ]}
          />
        </Text>
      </div>
    </Container>
  )
}
