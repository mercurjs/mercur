import { CheckCircleSolid, XCircle } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import {
  AdminPayoutCapture,
  useCancelPayoutCapture,
  useCapturePayoutCapture,
} from "../../../../hooks/api/payout-captures"
import { useDate } from "../../../../hooks/use-date"
import { getStylizedAmount } from "../../../../lib/money-amount-helpers"
import { getPayoutCaptureActionProps, toNumber } from "../../common/utils"

export const PayoutCaptureGeneralSection = ({
  capture,
}: {
  capture: AdminPayoutCapture
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { getFullDate } = useDate()

  const captureNow = useCapturePayoutCapture(capture.order_group_id)
  const cancel = useCancelPayoutCapture(capture.order_group_id)

  const action = getPayoutCaptureActionProps(capture.action, t)
  const capturable = toNumber(capture.capturable_amount)

  const formatDate = (value: Date | string | null | undefined) =>
    value ? getFullDate({ date: value, includeTime: true }) : "-"

  const handleCapture = async () => {
    const confirmed = await prompt({
      title: t("payoutCaptures.capture.title"),
      description: t("payoutCaptures.capture.description", {
        amount: getStylizedAmount(capturable, capture.currency_code),
      }),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    captureNow.mutate(undefined, {
      onSuccess: () => toast.success(t("payoutCaptures.capture.successToast")),
      onError: (error) => toast.error(error.message),
    })
  }

  const handleCancel = async () => {
    const confirmed = await prompt({
      title: t("payoutCaptures.cancel.title"),
      description: t("payoutCaptures.cancel.description"),
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    cancel.mutate(undefined, {
      onSuccess: () => toast.success(t("payoutCaptures.cancel.successToast")),
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Container className="divide-y p-0" data-testid="payout-capture-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading data-testid="payout-capture-general-section-heading">
          {capture.order_group_display_id
            ? `#${capture.order_group_display_id}`
            : capture.order_group_id}
        </Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge
            color={action.color}
            data-testid="payout-capture-general-section-status-badge"
          >
            {action.label}
          </StatusBadge>
          <ActionMenu
            data-testid="payout-capture-general-section-action-menu"
            groups={[
              {
                actions: [
                  {
                    label: t("payoutCaptures.actions.capture"),
                    icon: <CheckCircleSolid />,
                    onClick: handleCapture,
                    permission: "payouts:edit",
                    disabled: capturable <= 0,
                    disabledTooltip: t("payoutCaptures.actions.captureDisabled"),
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("payoutCaptures.actions.cancel"),
                    icon: <XCircle />,
                    onClick: handleCancel,
                    permission: "payouts:edit",
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow
        title={t("payoutCaptures.fields.authorizedAmount")}
        value={getStylizedAmount(
          toNumber(capture.authorized_amount),
          capture.currency_code,
        )}
      />
      <SectionRow
        title={t("payoutCaptures.fields.capturableAmount")}
        value={getStylizedAmount(capturable, capture.currency_code)}
      />
      <SectionRow
        title={t("payoutCaptures.fields.ordersDecided")}
        value={`${capture.orders_decided} / ${capture.orders_total}`}
      />
      <SectionRow
        title={t("payoutCaptures.fields.authorizedAt")}
        value={formatDate(capture.authorized_at)}
      />
      <SectionRow
        title={t("payoutCaptures.fields.expiresAt")}
        value={formatDate(capture.expires_at)}
      />
      {capture.capture_error && (
        <SectionRow
          title={t("payoutCaptures.fields.captureError")}
          value={
            <Text size="small" leading="compact" className="text-ui-fg-error">
              {capture.capture_error}
            </Text>
          }
        />
      )}
    </Container>
  )
}
