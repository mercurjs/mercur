import { PencilSquare } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { InferClientOutput } from "@mercurjs/client"
import { sdk } from "@lib/client"

import { ActionMenu } from "../../../../components/common/action-menu"

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"]

type SellerAddressSectionProps = {
  seller: Seller
}

export const SellerAddressSection = ({
  seller,
}: SellerAddressSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("addresses.title")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: `/sellers/${seller.id}/edit-address`,
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.address_1")}
        </Text>
        <Text size="small" leading="compact">
          {seller.address_1 || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.address_2")}
        </Text>
        <Text size="small" leading="compact">
          {seller.address_2 || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.city")}
        </Text>
        <Text size="small" leading="compact">
          {seller.city || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.province")}
        </Text>
        <Text size="small" leading="compact">
          {seller.province || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.postal_code")}
        </Text>
        <Text size="small" leading="compact">
          {seller.postal_code || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.country_code")}
        </Text>
        <Text size="small" leading="compact">
          {seller.country_code || "-"}
        </Text>
      </div>
    </Container>
  )
}
