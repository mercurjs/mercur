import { PencilSquare } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { HttpTypes } from "@mercurjs/types";

type StoreAddressSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

export const StoreAddressSection = ({ seller }: StoreAddressSectionProps) => {
  const { t } = useTranslation();
  const address = seller.address;

  const formatAddress = () => {
    const parts = [
      address?.address_1,
      address?.city,
      address?.province,
      address?.postal_code,
      address?.country_code?.toUpperCase(),
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
  };

  const formattedAddress = formatAddress();

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("store.address.header", "Address")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  icon: <PencilSquare />,
                  to: "address",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.firstName")}
        </Text>
        <Text size="small" leading="compact">
          {address?.first_name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.lastName")}
        </Text>
        <Text size="small" leading="compact">
          {address?.last_name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.address")}
        </Text>
        <Text size="small" leading="compact">
          {formattedAddress || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.phone")}
        </Text>
        <Text size="small" leading="compact">
          {address?.phone || "-"}
        </Text>
      </div>
    </Container>
  );
};
