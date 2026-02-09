import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { RouteDrawer } from "../../../components/modals";
import { useOrder } from "../../../hooks/api";
import { OrderBalanceSettlementForm } from "../order-balance-settlement";
import { DEFAULT_FIELDS } from "../order-detail/constants";
import { CreateRefundForm } from "./components/create-refund-form";

export const OrderCreateRefund = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { order } = useOrder(params.id!, {
    fields: DEFAULT_FIELDS,
  });

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("orders.payment.createRefund")}</Heading>
      </RouteDrawer.Header>

      {order && <CreateRefundForm order={order} />}
      {order && <OrderBalanceSettlementForm order={order} />}
    </RouteDrawer>
  );
};
