import { PencilSquare } from "@medusajs/icons";
import { Container, Heading, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import ImageAvatar from "@components/common/image-avatar/image-avatar";
import { HttpTypes } from "@mercurjs/types";

type StoreGeneralSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

export const SellerGeneralSection = ({ seller }: StoreGeneralSectionProps) => {
  const { t } = useTranslation();

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-4">
          {seller.logo && <ImageAvatar src={seller.logo} size={12} />}
          <div>
            <Heading>{seller.name}</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              {seller.handle}
            </Text>
          </div>
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
          {seller.name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.email")}
        </Text>
        <Text size="small" leading="compact">
          {seller.email || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.phone")}
        </Text>
        <Text size="small" leading="compact">
          {seller.phone || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.address")}
        </Text>
        <Text size="small" leading="compact">
          {[
            seller.address_1,
            seller.city,
            seller.province,
            seller.postal_code,
            seller.country_code,
          ]
            .filter(Boolean)
            .join(", ") || "-"}
        </Text>
      </div>
    </Container>
  );
};
