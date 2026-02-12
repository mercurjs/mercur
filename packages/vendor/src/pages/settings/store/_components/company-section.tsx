import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"

type CompanySectionProps = {
  store: HttpTypes.AdminStore
}

export const CompanySection = ({ store }: CompanySectionProps) => {
  const { t } = useTranslation()
  const storeAny = store as any

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("store.company", "Company")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("store.manageCompanyDetails", "Manage your company details")}
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: "edit-company",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.address")}
        </Text>
        <Text size="small" leading="compact">
          {storeAny.address_line || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.postalCode", "Postal code")}
        </Text>
        <Text size="small" leading="compact">
          {storeAny.postal_code || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.city")}
        </Text>
        <Text size="small" leading="compact">
          {storeAny.city || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.country")}
        </Text>
        <Text size="small" leading="compact">
          {storeAny.country_code || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.taxId", "Tax ID")}
        </Text>
        <Text size="small" leading="compact">
          {storeAny.tax_id || "-"}
        </Text>
      </div>
    </Container>
  )
}
