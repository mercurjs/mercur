import { HttpTypes } from "@medusajs/types";
import { Container, Heading, Text } from "@medusajs/ui";
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared";
import { useTranslation } from "react-i18next";

import { NoRecords } from "@components/common/empty-table-content";
import { getCountryByIso2 } from "@lib/data/countries";

type CustomerAddressSectionProps = {
  customer: HttpTypes.AdminCustomer;
};

const getAddressLabel = (address: HttpTypes.AdminCustomerAddress) => {
  if (address.address_name) {
    return address.address_name;
  }

  const name = [address.first_name, address.last_name]
    .filter(Boolean)
    .join(" ");

  return name || "Address";
};

export const CustomerAddressSection = ({
  customer,
}: CustomerAddressSectionProps) => {
  const { t } = useTranslation();

  const addresses = customer.addresses ?? [];

  return (
    <Container className="divide-y p-0" data-testid="customer-address-section">
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
            className="flex h-full flex-col overflow-hidden p-6"
            icon={null}
            title={t("customers.addresses.emptyTitle")}
            message={t("customers.addresses.emptyMessage")}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-y-2 p-3">
          {addresses.map((address) => {
            const country =
              getCountryByIso2(address.country_code)?.display_name ??
              address.country_code?.toUpperCase();
            const cityLine = [address.city, address.postal_code]
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={address.id}
                className="bg-ui-bg-subtle border-ui-border-base flex flex-col gap-y-1 rounded-lg border px-3 py-2"
                data-testid={`customer-address-section-address-${address.id}`}
              >
                <Text size="small" weight="plus" leading="compact">
                  {getAddressLabel(address)}
                </Text>
                {address.address_1 && (
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {address.address_1}
                  </Text>
                )}
                {address.address_2 && (
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {address.address_2}
                  </Text>
                )}
                {cityLine && (
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {cityLine}
                  </Text>
                )}
                {country && (
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-subtle"
                  >
                    {country}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      )}
      <DisplayExtensionZone model="customer" zone="addresses" data={customer} />
    </Container>
  );
};
