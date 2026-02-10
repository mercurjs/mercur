import { HandTruck, PencilSquare } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { NoRecords } from "@components/common/empty-table-content"
import { IconAvatar } from "@components/common/icon-avatar"
import { formatProvider } from "@lib/format-provider"
import { VendorExtendedAdminStockLocation } from "@custom-types/stock-location"

function LocationsFulfillmentProvidersSection({
  location,
}: {
  location: VendorExtendedAdminStockLocation
}) {
  const { t } = useTranslation()

  return (
    <Container className="flex flex-col px-6 py-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">
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
        />
      </div>

      {location.fulfillment_providers?.length ? (
        <div className="flex flex-col gap-y-4 pt-4">
          <div className="grid grid-cols-[28px_1fr] items-center gap-x-3 gap-y-3">
            {location.fulfillment_providers?.map((fulfillmentProvider) => {
              return (
                <Fragment key={fulfillmentProvider.id}>
                  <IconAvatar>
                    <HandTruck className="text-ui-fg-subtle" />
                  </IconAvatar>

                  <div className="txt-compact-small">
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
        />
      )}
    </Container>
  )
}

export default LocationsFulfillmentProvidersSection
