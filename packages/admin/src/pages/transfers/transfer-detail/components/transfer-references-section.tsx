import { TriangleRightMini } from "@medusajs/icons"
import { Avatar, Container, Heading, Text } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { AdminTransfer } from "../../../../hooks/api/transfers"

type Reference = {
  id: string
  label: string
  value: string
  to?: string
  avatar?: string
}

const ReferenceCard = ({ reference }: { reference: Reference }) => {
  const inner = (
    <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
      <div className="flex items-center gap-3">
        {reference.avatar && (
          <Avatar size="small" fallback={reference.avatar} />
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          <span className="text-ui-fg-base font-medium">{reference.label}</span>
          <span className="text-ui-fg-subtle truncate">{reference.value}</span>
        </div>
        {reference.to && (
          <div className="flex size-7 items-center justify-center">
            <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
          </div>
        )}
      </div>
    </div>
  )

  if (!reference.to) {
    return <div data-testid={`transfer-reference-${reference.id}`}>{inner}</div>
  }

  return (
    <Link
      to={reference.to}
      className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
      data-testid={`transfer-reference-${reference.id}`}
    >
      {inner}
    </Link>
  )
}

export const TransferReferencesSection = ({
  transfer,
}: {
  transfer: AdminTransfer
}) => {
  const { t } = useTranslation()
  const seller = transfer.account?.seller

  const references: Reference[] = []

  if (seller?.id) {
    references.push({
      id: "store",
      label: seller.name ?? seller.id,
      value: seller.handle ?? seller.id,
      to: `/stores/${seller.id}`,
      avatar: (seller.name?.[0] ?? "?").toUpperCase(),
    })
  }

  if (transfer.account?.id) {
    references.push({
      id: "payout-account",
      label: t("transfers.payoutAccount"),
      value: transfer.account.provider_account_id ?? transfer.account.id,
      to: `/payout-accounts/${transfer.account.id}`,
    })
  }

  if (transfer.order_id) {
    references.push({
      id: "order",
      label: t("transfers.fields.order"),
      value: transfer.order_id,
      to: `/orders/${transfer.order_id}`,
    })
  }

  if (transfer.settlement_id) {
    references.push({
      id: "settlement",
      label: t("transfers.fields.settlement"),
      value: transfer.settlement_id,
      to: `/settlements/${transfer.settlement_id}`,
    })
  }

  if (transfer.reverses_transfer_id) {
    references.push({
      id: "reverses-transfer",
      label: t("transfers.fields.reversesTransfer"),
      value: transfer.reverses_transfer_id,
      to: `/transfers/${transfer.reverses_transfer_id}`,
    })
  }

  if (transfer.refund_id) {
    references.push({
      id: "refund",
      label: t("transfers.fields.refund"),
      value: transfer.refund_id,
    })
  }

  if (transfer.source_payment_id) {
    references.push({
      id: "source-payment",
      label: t("transfers.fields.sourcePayment"),
      value: transfer.source_payment_id,
    })
  }

  if (transfer.adjustment_id) {
    references.push({
      id: "adjustment",
      label: t("transfers.fields.adjustment"),
      value: transfer.adjustment_id,
    })
  }

  let content: ReactNode

  if (references.length === 0) {
    content = (
      <div className="border-t px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {t("transfers.references.empty")}
        </Text>
      </div>
    )
  } else {
    content = (
      <div className="txt-small flex flex-col gap-2 px-2 pb-2">
        {references.map((reference) => (
          <ReferenceCard key={reference.id} reference={reference} />
        ))}
      </div>
    )
  }

  return (
    <Container className="p-0" data-testid="transfer-references-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("transfers.references.header")}</Heading>
      </div>
      {content}
    </Container>
  )
}
