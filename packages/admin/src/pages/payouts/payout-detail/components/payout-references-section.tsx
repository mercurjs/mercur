import { TriangleRightMini } from "@medusajs/icons"
import { Avatar, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { AdminPayout } from "../../../../lib/payouts"

type Reference = {
  id: string
  label: string
  value: string
  to: string
  avatar?: string
}

const ReferenceCard = ({ reference }: { reference: Reference }) => (
  <Link
    to={reference.to}
    className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
    data-testid={`payout-reference-${reference.id}`}
  >
    <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
      <div className="flex items-center gap-3">
        {reference.avatar && (
          <Avatar size="small" fallback={reference.avatar} />
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          <span className="text-ui-fg-base font-medium">{reference.label}</span>
          <span className="text-ui-fg-subtle truncate">{reference.value}</span>
        </div>
        <div className="flex size-7 items-center justify-center">
          <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
        </div>
      </div>
    </div>
  </Link>
)

export const PayoutReferencesSection = ({ payout }: { payout: AdminPayout }) => {
  const { t } = useTranslation()
  const seller = payout.seller ?? payout.account?.seller

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

  if (payout.account_id) {
    references.push({
      id: "payout-account",
      label: t("payouts.fields.payoutAccount"),
      value: payout.account_id,
      to: `/payout-accounts/${payout.account_id}`,
    })
  }

  if (payout.order_id) {
    references.push({
      id: "order",
      label: t("payouts.fields.order"),
      value: payout.order_id,
      to: `/orders/${payout.order_id}`,
    })
  }

  return (
    <Container className="p-0" data-testid="payout-references-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("payouts.references.header")}</Heading>
      </div>
      {references.length === 0 ? (
        <div className="border-t px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("payouts.references.empty")}
          </Text>
        </div>
      ) : (
        <div className="txt-small flex flex-col gap-2 px-2 pb-2">
          {references.map((reference) => (
            <ReferenceCard key={reference.id} reference={reference} />
          ))}
        </div>
      )}
    </Container>
  )
}
