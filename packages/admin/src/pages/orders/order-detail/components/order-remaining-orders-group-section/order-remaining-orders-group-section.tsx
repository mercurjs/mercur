import {
  Badge,
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
} from "@medusajs/ui";
import { useNavigate, useParams } from "react-router-dom";
import { HttpTypes } from "@mercurjs/types";
import {
  getCanceledOrderStatus,
  getOrderPaymentStatus,
} from "@/lib/order-helpers";
import { useTranslation } from "react-i18next";
import { useOrderGroup } from "@/hooks/api";

const OrderBadge = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation();
  const orderStatus = getCanceledOrderStatus(t, order.status);

  if (!orderStatus) {
    return null;
  }

  return (
    <StatusBadge color={orderStatus.color} className="text-nowrap">
      {orderStatus.label}
    </StatusBadge>
  );
};

const PaymentBadge = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation();

  const { label, color } = getOrderPaymentStatus(t, order.payment_status);

  return (
    <StatusBadge color={color} className="text-nowrap">
      {label}
    </StatusBadge>
  );
};

export const OrderRemainingOrdersGroupSection = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { order_group, isLoading } = useOrderGroup(id!);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const { orders } = order_group || {};

  return (
    <Container data-testid="order-remaining-orders-group-section">
      <Heading
        level="h2"
        className="text-lg font-medium"
        data-testid="order-remaining-orders-group-heading"
      >
        Remaining orders group
      </Heading>
      <div data-testid="order-remaining-orders-group-list">
        {orders?.map((order: any) => {
          const items =
            order.items.length > 1
              ? `${order.items[0].subtitle} + ${order.items.length - 1} more`
              : order.items[0].subtitle;
          return (
            <Button
              variant="secondary"
              key={order.id}
              className="cursor-pointer w-full flex text-left mt-4"
              onClick={() => {
                navigate(`/orders/${order.id}`);
              }}
              data-testid={`order-remaining-orders-group-item-${order.id}`}
            >
              <div className="w-full relative">
                <div className="flex items-center justify-between gap-2">
                  <Heading
                    level="h3"
                    className="text-md font-medium w-1/3 truncate"
                    data-testid={`order-remaining-orders-group-item-${order.id}-heading`}
                  >
                    #{order.display_id}
                  </Heading>
                  <div
                    className="flex w-2/3"
                    data-testid={`order-remaining-orders-group-item-${order.id}-badges`}
                  >
                    <Badge className="scale-75 -mr-8">
                      <span className="text-xs mr-2">Payment</span>
                      <PaymentBadge order={order} />
                    </Badge>
                    <Badge className="scale-75 -mr-4">
                      <span className="text-xs mr-2">Order</span>
                      <OrderBadge order={order} />
                    </Badge>
                  </div>
                </div>
                <Text
                  className="truncate"
                  data-testid={`order-remaining-orders-group-item-${order.id}-items`}
                >
                  {items}
                </Text>
              </div>
            </Button>
          );
        })}
      </div>
    </Container>
  );
};
