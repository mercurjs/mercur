import { HandTruck, PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { NoRecords } from "../../../../../components/common/empty-table-content"
import { IconAvatar } from "../../../../../components/common/icon-avatar"
import { useFulfillmentProviders } from "../../../../../hooks/api"
import { formatProvider } from "../../../../../lib/format-provider"

type LocationsFulfillmentProvidersSectionProps = {
  location: HttpTypes.AdminStockLocation
}

function LocationsFulfillmentProvidersSection({
  location,
}: LocationsFulfillmentProvidersSectionProps) {
  const { t } = useTranslation()
  const { fulfillment_providers } = useFulfillmentProviders({
    stock_location_id: location.id,
    fields: "id",
    is_enabled: true,
  })

  return (
    <Container className="flex flex-col px-6 py-4" data-testid="location-fulfillment-providers-section-container">
      <div className="flex items-center justify-between" data-testid="location-fulfillment-providers-section-header">
        <Heading level="h2" data-testid="location-fulfillment-providers-section-heading">
          {t("stockLocations.fulfillmentProviders.header")}
        </Heading>

        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "fulfillment-providers",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
          data-testid="location-fulfillment-providers-section-action-menu"
        />
      </div>

      {fulfillment_providers?.length ? (
        <div className="flex flex-col gap-y-4 pt-4" data-testid="location-fulfillment-providers-section-content">
          <div className="grid grid-cols-[28px_1fr] items-center gap-x-3 gap-y-3" data-testid="location-fulfillment-providers-section-list">
            {fulfillment_providers?.map((fulfillmentProvider) => {
              return (
                <Fragment key={fulfillmentProvider.id}>
                  <IconAvatar data-testid={`location-fulfillment-providers-section-provider-icon-${fulfillmentProvider.id}`}>
                    <HandTruck className="text-ui-fg-subtle" />
                  </IconAvatar>

                  <div className="txt-compact-small" data-testid={`location-fulfillment-providers-section-provider-name-${fulfillmentProvider.id}`}>
                    {formatProvider(fulfillmentProvider.id)}
                  </div>
                </Fragment>
              )
            })}
          </div>
        </div>
      ) : (
        <NoRecords
          className="h-fit pb-2 pt-6 text-center"
          action={{
            label: t("stockLocations.fulfillmentProviders.action"),
            to: "fulfillment-providers",
          }}
          message={t("stockLocations.fulfillmentProviders.noProviders")}
          data-testid="location-fulfillment-providers-section-no-records"
        />
      )}
    </Container>
  )
}

export default LocationsFulfillmentProvidersSection
