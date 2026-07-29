import {
  BuildingStorefront,
  ShoppingCart,
  TriangleRightMini,
  User,
} from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { AdminReview } from "../../../../hooks/api/reviews"

const LinkRow = ({
  to,
  icon,
  title,
  subtitle,
  testId,
}: {
  to: string
  icon: ReactNode
  title: string
  subtitle?: string
  testId: string
}) => (
  <Link
    to={to}
    className="bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover flex items-center justify-between gap-x-4 px-6 py-4 transition-fg"
    data-testid={testId}
  >
    <div className="flex items-center gap-x-3 overflow-hidden">
      <div className="bg-ui-bg-component shadow-borders-base flex size-7 items-center justify-center rounded-md [&_svg]:text-ui-fg-subtle">
        {icon}
      </div>
      <div className="flex flex-col overflow-hidden">
        <Text size="small" leading="compact" weight="plus" className="truncate">
          {title}
        </Text>
        {subtitle ? (
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-subtle truncate"
          >
            {subtitle}
          </Text>
        ) : null}
      </div>
    </div>
    <TriangleRightMini className="text-ui-fg-muted" />
  </Link>
)

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

export const ReviewCustomerSection = ({ review }: { review: AdminReview }) => {
  const { t } = useTranslation()
  const customer = review.customer

  if (!customer) {
    return null
  }

  const name =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.email ||
    customer.id

  return (
    <SidebarCard title={t("reviews.detail.customer")}>
      <LinkRow
        to={`/customers/${customer.id}`}
        icon={<User />}
        title={name}
        subtitle={customer.email ?? undefined}
        testId="review-customer-link"
      />
    </SidebarCard>
  )
}

export const ReviewOrderSection = ({ review }: { review: AdminReview }) => {
  const { t } = useTranslation()
  const order = review.order

  if (!order) {
    return null
  }

  const date = order.created_at
    ? new Date(order.created_at).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined

  return (
    <SidebarCard title={t("reviews.detail.order")}>
      <LinkRow
        to={`/orders/${order.id}`}
        icon={<ShoppingCart />}
        title={`#${order.display_id}`}
        subtitle={date}
        testId="review-order-link"
      />
    </SidebarCard>
  )
}

export const ReviewStoreSection = ({ review }: { review: AdminReview }) => {
  const { t } = useTranslation()
  const seller = review.seller

  if (!seller) {
    return null
  }

  return (
    <SidebarCard title={t("reviews.detail.store")}>
      <LinkRow
        to={`/stores/${seller.id}`}
        icon={<BuildingStorefront />}
        title={seller.name}
        subtitle={seller.email ?? undefined}
        testId="review-store-link"
      />
    </SidebarCard>
  )
}
