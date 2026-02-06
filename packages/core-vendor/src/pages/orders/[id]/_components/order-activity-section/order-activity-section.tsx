import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ExtendedAdminOrder } from "@custom-types/order"
import { OrderTimeline } from "./order-timeline"

type OrderActivityProps = {
  order: ExtendedAdminOrder
}

export const OrderActivitySection = ({ order }: OrderActivityProps) => {
  const { t } = useTranslation()
  return (
    <Container className="flex flex-col gap-y-8 px-6 py-4">
      <div className="flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <Heading level="h2">{t("orders.activity.header")}</Heading>
        </div>
      </div>
      <OrderTimeline order={order} />
    </Container>
  )
}
