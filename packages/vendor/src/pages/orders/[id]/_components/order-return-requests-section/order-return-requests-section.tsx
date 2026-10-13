import { ArrowUturnLeft } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { Button, Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useReturnRequests } from "@hooks/api/return-requests";
import { getReturnRequestStatusProps } from "../../../../return-requests/common/utils";

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const OrderReturnRequestsSection = ({
  order,
}: {
  order: HttpTypes.AdminOrder;
}) => {
  const { t } = useTranslation();
  const { return_requests: returnRequests = [] } = useReturnRequests({
    order_id: order.id,
    limit: 50,
    order: "-created_at",
  });

  if (!returnRequests.length) {
    return null;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("returnRequests.domain")}</Heading>
      </div>
      {returnRequests.map((request) => {
        const { color, label } = getReturnRequestStatusProps(request.status, t);
        return (
          <div
            key={request.id}
            className="flex items-center justify-between gap-x-4 px-6 py-4"
          >
            <div className="flex items-center gap-x-3">
              <ArrowUturnLeft className="text-ui-fg-subtle" />
              <div className="flex flex-col">
                <Text size="small" leading="compact" weight="plus">
                  {t(`returnRequests.actor.${request.requested_by_type}`)} ·{" "}
                  {formatDate(request.created_at)}
                </Text>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                  {request.note || "-"}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              <StatusBadge color={color}>{label}</StatusBadge>
              <Button size="small" variant="secondary" asChild>
                <Link to={`/return-requests/${request.id}`}>
                  {t("actions.view")}
                </Link>
              </Button>
            </div>
          </div>
        );
      })}
    </Container>
  );
};
