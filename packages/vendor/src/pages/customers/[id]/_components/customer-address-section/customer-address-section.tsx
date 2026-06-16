import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { NoRecords } from "@components/common/empty-table-content"

type CustomerAddressSectionProps = {
  customer: HttpTypes.AdminCustomer
}

const getAddressLabel = (address: HttpTypes.AdminCustomerAddress) => {
  if (address.address_name) {
    return address.address_name
  }

  const name = [address.first_name, address.last_name]
    .filter(Boolean)
    .join(" ")

  return name || "Address"
}

export const CustomerAddressSection = ({
  customer,
}: CustomerAddressSectionProps) => {
  const { t } = useTranslation()

  const addresses = customer.addresses ?? []

  return (
    <Container
      className="divide-y p-0"
      data-testid="customer-address-section"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="customer-address-section-header"
      >
        <Heading level="h2" data-testid="customer-address-section-heading">
          {t("customers.addresses.title")}
        </Heading>
      </div>

      {addresses.length === 0 ? (
        <div data-testid="customer-address-section-empty">
          <NoRecords
            className="flex h-full flex-col overflow-hidden border-t p-6"
            icon={null}
            title={t("general.noRecordsTitle")}
            message={t("general.noRecordsMessage")}
          />
        </div>
      ) : (
        addresses.map((address) => (
          <div
            key={address.id}
            className="flex flex-col gap-y-1 px-6 py-4"
            data-testid={`customer-address-section-address-${address.id}`}
          >
            <Text size="small" weight="plus" leading="compact">
              {getAddressLabel(address)}
            </Text>
            {address.address_1 && (
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {address.address_1}
              </Text>
            )}
            {address.address_2 && (
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {address.address_2}
              </Text>
            )}
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {[address.city, address.postal_code].filter(Boolean).join(", ")}
            </Text>
            {address.country_code && (
              <Text size="small" leading="compact" className="text-ui-fg-subtle">
                {address.country_code.toUpperCase()}
              </Text>
            )}
          </div>
        ))
      )}
    </Container>
  )
}
