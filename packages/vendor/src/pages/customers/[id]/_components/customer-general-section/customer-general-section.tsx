import { HttpTypes } from "@medusajs/types"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { DisplayExtensionZone, DisplayField } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

type CustomerGeneralSectionProps = {
  customer: HttpTypes.AdminCustomer
}

export const CustomerGeneralSection = ({
  customer,
}: CustomerGeneralSectionProps) => {
  const { t } = useTranslation()

  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")

  const statusColor = customer.has_account ? "green" : "orange"
  const statusText = customer.has_account
    ? t("customers.fields.registered")
    : t("customers.fields.guest")

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <DisplayField model="customer" zone="general" id="email" data={customer}>
          <Heading>{customer.email}</Heading>
        </DisplayField>
        <div className="flex items-center gap-x-2">
          <DisplayField
            model="customer"
            zone="general"
            id="status"
            data={customer}
          >
            <StatusBadge color={statusColor}>{statusText}</StatusBadge>
          </DisplayField>
        </div>
      </div>
      <DisplayField model="customer" zone="general" id="name" data={customer}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.name")}
          </Text>
          <Text size="small" leading="compact">
            {name || "-"}
          </Text>
        </div>
      </DisplayField>
      <DisplayField
        model="customer"
        zone="general"
        id="company_name"
        data={customer}
      >
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.company")}
          </Text>
          <Text size="small" leading="compact">
            {customer.company_name || "-"}
          </Text>
        </div>
      </DisplayField>
      <DisplayField model="customer" zone="general" id="phone" data={customer}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("fields.phone")}
          </Text>
          <Text size="small" leading="compact">
            {customer.phone || "-"}
          </Text>
        </div>
      </DisplayField>
      <DisplayExtensionZone
        model="customer"
        zone="general"
        data={customer}
        builtInFieldIds={["email", "status", "name", "company_name", "phone"]}
      />
    </Container>
  )
}
