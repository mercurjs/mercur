import { Button, Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { PermissionAction } from "@mercurjs/dashboard-shared"

import { AdminReturnRequest } from "../../../../hooks/api/return-requests"
import { getLocaleAmount } from "../../../../lib/money-amount-helpers"
import {
  getReturnRequestStatusColor,
  isApprovable,
  isDeclinable,
} from "../../common/utils"

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
    <Text size="small" leading="compact" weight="plus">
      {label}
    </Text>
    <div className="text-ui-fg-subtle">{children}</div>
  </div>
)

export const ReturnRequestGeneralSection = ({
  returnRequest,
}: {
  returnRequest: AdminReturnRequest
}) => {
  const { t } = useTranslation()

  const createdAt = new Date(returnRequest.created_at).toLocaleString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )

  const currencyCode = returnRequest.order?.currency_code
  const isPending = returnRequest.status === "pending"

  return (
    <Container
      className="divide-y p-0"
      data-testid="return-request-general-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("returnRequests.detail.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {createdAt}
          </Text>
        </div>
        <StatusBadge color={getReturnRequestStatusColor(returnRequest.status)}>
          {t(`returnRequests.status.${returnRequest.status}`)}
        </StatusBadge>
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
            {returnRequest.return_required ? t("fields.true") : t("fields.false")}
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
        <>
          <Row label={t("returnRequests.fields.refundAmount")}>
            <Text size="small" leading="compact">
              {returnRequest.refund_amount !== null && currencyCode
                ? getLocaleAmount(Number(returnRequest.refund_amount), currencyCode)
                : "-"}
            </Text>
          </Row>
          <Row label={t("returnRequests.fields.refundNote")}>
            <Text size="small" leading="compact">
              {returnRequest.refund_note || "-"}
            </Text>
          </Row>
        </>
      )}

      {(isPending || isDeclinable(returnRequest.status) || isApprovable(returnRequest.status)) && (
        <div className="flex items-center justify-end gap-x-2 px-6 py-4">
          {isDeclinable(returnRequest.status) && (
            <PermissionAction permission="orders.returns:edit">
              <Button size="small" variant="secondary" asChild>
                <Link to="decline">{t("returnRequests.decline.action")}</Link>
              </Button>
            </PermissionAction>
          )}
          {isPending && (
            <PermissionAction permission="orders.returns:edit">
              <Button size="small" variant="secondary" asChild>
                <Link to="accept">{t("returnRequests.accept.action")}</Link>
              </Button>
            </PermissionAction>
          )}
          {isApprovable(returnRequest.status) && (
            <PermissionAction permission="orders.refunds:edit">
              <Button size="small" variant="primary" asChild>
                <Link to="approve">{t("returnRequests.approve.action")}</Link>
              </Button>
            </PermissionAction>
          )}
        </div>
      )}
    </Container>
  )
}
