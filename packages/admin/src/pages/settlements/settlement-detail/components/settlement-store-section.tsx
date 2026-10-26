import { TriangleRightMini } from "@medusajs/icons"
import { Avatar, Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { AdminSettlement } from "../../../../hooks/api/settlements"

export const SettlementStoreSection = ({
  settlement,
}: {
  settlement: AdminSettlement
}) => {
  const { t } = useTranslation()
  const seller = settlement.seller

  return (
    <Container className="p-0" data-testid="settlement-store-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("settlements.fields.store")}</Heading>
      </div>
      {seller?.id ? (
        <div className="txt-small flex flex-col gap-2 px-2 pb-2">
          <Link
            to={`/stores/${seller.id}`}
            className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
            data-testid="settlement-store-link"
          >
            <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar
                  size="small"
                  fallback={(seller.name?.[0] ?? "?").toUpperCase()}
                />
                <div className="flex flex-1 flex-col">
                  <span className="text-ui-fg-base font-medium">
                    {seller.name ?? seller.id}
                  </span>
                  {seller.handle && (
                    <span className="text-ui-fg-subtle">{seller.handle}</span>
                  )}
                </div>
                <div className="flex size-7 items-center justify-center">
                  <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
                </div>
              </div>
            </div>
          </Link>
          <Link
            to={`/payout-accounts/${settlement.account_id}`}
            className="outline-none focus-within:shadow-borders-interactive-with-focus rounded-md [&:hover>div]:bg-ui-bg-component-hover"
            data-testid="settlement-payout-account-link"
          >
            <div className="shadow-elevation-card-rest bg-ui-bg-component rounded-md px-4 py-2 transition-colors">
              <div className="flex items-center gap-3">
                <div className="flex flex-1 flex-col">
                  <span className="text-ui-fg-base font-medium">
                    {t("settlements.payoutAccount")}
                  </span>
                  <span className="text-ui-fg-subtle">{settlement.account_id}</span>
                </div>
                <div className="flex size-7 items-center justify-center">
                  <TriangleRightMini className="text-ui-fg-muted rtl:rotate-180" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      ) : (
        <div className="border-t px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("settlements.noStore")}
          </Text>
        </div>
      )}
    </Container>
  )
}
