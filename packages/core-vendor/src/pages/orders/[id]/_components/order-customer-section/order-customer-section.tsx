import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { CustomerInfo } from "@components/common/customer-info"
import { HttpTypes } from "@medusajs/types"

type OrderCustomerSectionProps = {
  order: HttpTypes.AdminOrder
}

export const OrderCustomerSection = ({ order }: OrderCustomerSectionProps) => {
  return (
    <Container className="divide-y p-0">
      <Header />
      <CustomerInfo.ID data={order} />
      <CustomerInfo.Contact data={order} />
      <CustomerInfo.Company data={order} />
      <CustomerInfo.Addresses data={order} />
    </Container>
  )
}

const Header = () => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{t("fields.customer")}</Heading>
    </div>
  )
}
