import { BuildingStorefront, PencilSquare } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { IconAvatar } from "@components/common/icon-avatar";
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
      address?.postal_code,
      address?.country_code?.toUpperCase(),
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : null;
  };

  const formattedAddress = formatAddress();

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("store.address.header")}</Heading>
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
      {formattedAddress ? (
        <div className="flex flex-col gap-2 px-2 pb-2">
          <div className="px-4 pb-2">
            <div className="flex items-center gap-4">
              <IconAvatar size="large" variant="squared">
                <BuildingStorefront />
              </IconAvatar>
              <div className="flex flex-1 flex-col">
                <Text size="small" leading="compact" weight="plus">
                  {[address?.first_name, address?.last_name]
                    .filter(Boolean)
                    .join(" ") || address?.company || formattedAddress}
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  {formattedAddress}
                </Text>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-y-1 pb-6 pt-2">
          <Text size="small" leading="compact" weight="plus">
            {t("store.address.empty.title")}
          </Text>
          <Text size="small" className="text-ui-fg-muted">
            {t("store.address.empty.message")}
          </Text>
        </div>
      )}
    </Container>
  );
};
