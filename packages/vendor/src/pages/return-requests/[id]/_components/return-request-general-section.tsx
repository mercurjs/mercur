import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button, Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { PermissionAction } from "@mercurjs/dashboard-shared";

import type { VendorReturnRequest } from "@hooks/api/return-requests";

import { getReturnRequestStatusProps } from "../../common/utils";

const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
    <Text size="small" leading="compact" weight="plus">
      {label}
    </Text>
    <div>{children}</div>
  </div>
);

export const ReturnRequestGeneralSection = ({
  returnRequest,
}: {
  returnRequest: VendorReturnRequest;
}) => {
  const { t } = useTranslation();
  const { color, label } = getReturnRequestStatusProps(returnRequest.status, t);

  const isPending = returnRequest.status === "pending";
  const canDecline =
    returnRequest.status === "awaiting_return" ||
    returnRequest.status === "returned";
  const canReceive =
    returnRequest.status === "awaiting_return" && returnRequest.return_id;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("returnRequests.detail.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {formatDateTime(returnRequest.created_at)}
          </Text>
        </div>
        <StatusBadge color={color}>{label}</StatusBadge>
      </div>

      <Row label={t("returnRequests.fields.requestedBy")}>
        <Text size="small" leading="compact">
          {t(`returnRequests.actor.${returnRequest.requested_by_type}`)}
        </Text>
      </Row>

      <Row label={t("returnRequests.fields.note")}>
        <Text size="small" leading="compact">
          {returnRequest.note || "-"}
        </Text>
      </Row>

      {returnRequest.attachments?.length > 0 && (
        <Row label={t("returnRequests.fields.attachments")}>
          <div className="flex flex-col gap-y-1">
            {returnRequest.attachments.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-ui-fg-interactive txt-small truncate hover:underline"
              >
                {url}
              </a>
            ))}
          </div>
        </Row>
      )}

      {returnRequest.return_required !== null && (
        <Row label={t("returnRequests.fields.returnRequired")}>
          <Text size="small" leading="compact">
            {returnRequest.return_required
              ? t("fields.true")
              : t("fields.false")}
          </Text>
        </Row>
      )}

      {returnRequest.status === "declined" && (
        <Row label={t("returnRequests.fields.declineReason")}>
          <Text size="small" leading="compact">
            {returnRequest.decline_reason || "-"}
            {returnRequest.decline_code ? ` (${returnRequest.decline_code})` : ""}
          </Text>
        </Row>
      )}

      {returnRequest.status === "refunded" && (
        <Row label={t("returnRequests.fields.refundNote")}>
          <Text size="small" leading="compact">
            {returnRequest.refund_note || "-"}
          </Text>
        </Row>
      )}

      {(isPending || canDecline || canReceive) && (
        <div className="flex items-center justify-end gap-x-2 px-6 py-4">
          {(isPending || canDecline) && (
            <PermissionAction permission="orders.returns:edit">
              <Button size="small" variant="secondary" asChild>
                <Link to="decline">{t("returnRequests.decline.action")}</Link>
              </Button>
            </PermissionAction>
          )}
          {isPending && (
            <PermissionAction permission="orders.returns:edit">
              <Button size="small" variant="primary" asChild>
                <Link to="accept">{t("returnRequests.accept.action")}</Link>
              </Button>
            </PermissionAction>
          )}
          {canReceive && (
            <PermissionAction permission="orders.returns:edit">
              <Button size="small" variant="primary" asChild>
                <Link
                  to={`/orders/${returnRequest.order_id}/returns/${returnRequest.return_id}/receive`}
                >
                  {t("returnRequests.receive.action")}
                </Link>
              </Button>
            </PermissionAction>
          )}
        </div>
      )}
    </Container>
  );
};
