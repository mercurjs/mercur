import { BuildingStorefront, ShoppingCart, User } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { SidebarLink } from "../../../../components/common/sidebar-link/sidebar-link"
import { AdminReturnRequest } from "../../../../hooks/api/return-requests"
import { customerName } from "../../common/utils"

const SidebarCard = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <Container className="divide-y p-0">
    <div className="flex items-center justify-between px-6 py-4">
      <Heading level="h2">{title}</Heading>
    </div>
    {children}
  </Container>
)

export const ReturnRequestCustomerSection = ({
  returnRequest,
}: {
  returnRequest: AdminReturnRequest
}) => {
  const { t } = useTranslation()
  const customer = returnRequest.customer

  if (!customer) {
    return null
  }

  return (
    <SidebarCard title={t("returnRequests.detail.customer")}>
      <SidebarLink
        to={`/customers/${customer.id}`}
        labelKey={customerName(customer)}
        descriptionKey={customer.email ?? ""}
        icon={<User />}
        dataTestid="return-request-customer-link"
      />
    </SidebarCard>
  )
}

export const ReturnRequestOrderSection = ({
  order,
}: {
  order?: HttpTypes.AdminOrder
}) => {
  const { t } = useTranslation()

  if (!order) {
    return null
  }

  return (
    <SidebarCard title={t("returnRequests.detail.order")}>
      <SidebarLink
        to={`/orders/${order.id}`}
        labelKey={`#${order.display_id}`}
        descriptionKey={order.email ?? ""}
        icon={<ShoppingCart />}
        dataTestid="return-request-order-link"
      />
    </SidebarCard>
  )
}

export const ReturnRequestStoreSection = ({
  returnRequest,
}: {
  returnRequest: AdminReturnRequest
}) => {
  const { t } = useTranslation()
  const seller = returnRequest.seller

  if (!seller) {
    return null
  }

  return (
    <SidebarCard title={t("returnRequests.detail.store")}>
      <SidebarLink
        to={`/stores/${seller.id}`}
        labelKey={seller.name}
        descriptionKey={seller.email ?? ""}
        icon={<BuildingStorefront />}
        dataTestid="return-request-store-link"
      />
    </SidebarCard>
  )
}
