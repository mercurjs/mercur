import { Children, ReactNode } from "react";
import { Container, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import ImageAvatar from "@components/common/image-avatar/image-avatar";
import { HttpTypes } from "@mercurjs/types";

import { SellerDetailHeader } from "./seller-detail-header";

type SellerGeneralSectionProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
  children?: ReactNode;
};

export const SellerGeneralSection = ({
  seller,
  children,
}: SellerGeneralSectionProps) => {
  const { t } = useTranslation();

  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <SellerDetailHeader seller={seller} />
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("store.logo", "Logo")}
            </Text>
            {seller.logo ? (
              <ImageAvatar src={seller.logo} size={12} />
            ) : (
              <Text size="small" leading="compact">
                {"-"}
              </Text>
            )}
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("store.coverImage", "Cover image")}
            </Text>
            {seller.cover_image ? (
              <ImageAvatar src={seller.cover_image} size={12} />
            ) : (
              <Text size="small" leading="compact">
                {"-"}
              </Text>
            )}
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.handle")}
            </Text>
            <Text size="small" leading="compact">
              {seller.handle || "-"}
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
              {seller.address_1 || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.address2")}
            </Text>
            <Text size="small" leading="compact">
              {seller.address_2 || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.city")}
            </Text>
            <Text size="small" leading="compact">
              {seller.city || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.state")}
            </Text>
            <Text size="small" leading="compact">
              {seller.province || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.postalCode")}
            </Text>
            <Text size="small" leading="compact">
              {seller.postal_code || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.country")}
            </Text>
            <Text size="small" leading="compact">
              {seller.country_code || "-"}
            </Text>
          </div>
        </>
      )}
    </Container>
  );
};
