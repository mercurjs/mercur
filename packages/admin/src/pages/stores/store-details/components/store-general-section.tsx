import { Children, ReactNode } from "react";
import { Badge, Container, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";

import { StoreDetailHeader } from "./store-detail-header";
import { currencies } from "@/lib/data/currencies";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreGeneralSectionProps = {
  seller: Seller;
  children?: ReactNode;
};

export const StoreGeneralSection = ({
  seller,
  children,
}: StoreGeneralSectionProps) => {
  const { t } = useTranslation();

  return (
    <Container className="divide-y p-0">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <div className="bg-ui-bg-subtle relative h-32 w-full overflow-hidden rounded-t-lg">
            {seller.banner ? (
              <img
                src={seller.banner}
                alt={seller.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div
                  className="h-full w-full"
                  style={{
                    background: `repeating-linear-gradient(
                      -45deg,
                      transparent,
                      transparent 10px,
                      rgba(255,255,255,0.5) 10px,
                      rgba(255,255,255,0.5) 20px
                    )`,
                  }}
                />
              </div>
            )}
          </div>
          <StoreDetailHeader seller={seller} />
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.description")}
            </Text>
            <Text size="small" leading="compact">
              {seller.description || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.handle")}
            </Text>
            <Text size="small" leading="compact">
              {seller.handle ? `/${seller.handle}` : "-"}
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
              {t("fields.website")}
            </Text>
            <Text size="small" leading="compact">
              {seller.website_url || "-"}
            </Text>
          </div>
          <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              {t("fields.currency")}
            </Text>
            <div className="flex items-center gap-x-2">
              <Badge size="2xsmall">
                {seller.currency_code?.toUpperCase()}
              </Badge>
              <Text size="small" leading="compact">
                {currencies[seller.currency_code?.toUpperCase()]?.name || "-"}
              </Text>
            </div>
          </div>
        </>
      )}
    </Container>
  );
};
