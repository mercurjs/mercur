import { BuildingStorefront, CurrencyDollar, ShoppingCart } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SidebarLink } from "../../../../components/common/sidebar-link/sidebar-link"
import { AdminPayout } from "../../../../lib/payouts"

export const PayoutReferencesSection = ({ payout }: { payout: AdminPayout }) => {
  const { t } = useTranslation()
  const seller = payout.seller ?? payout.account?.seller

  const hasReferences = !!seller?.id || !!payout.account_id || !!payout.order_id

  return (
    <Container className="p-0" data-testid="payout-references-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("payouts.references.header")}</Heading>
      </div>
      {!hasReferences && (
        <div className="border-t px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("payouts.references.empty")}
          </Text>
        </div>
      )}
      {payout.order_id && (
        <SidebarLink
          to={`/orders/${payout.order_id}`}
          labelKey={t("payouts.fields.order")}
          descriptionKey={
            payout.order?.display_id ? `#${payout.order.display_id}` : payout.order_id
          }
          icon={<ShoppingCart />}
          dataTestid="payout-reference-order"
        />
      )}
      {seller?.id && (
        <SidebarLink
          to={`/stores/${seller.id}`}
          labelKey={seller.name ?? seller.id}
          descriptionKey={seller.handle ?? seller.id}
          icon={<BuildingStorefront />}
          dataTestid="payout-reference-store"
        />
      )}
      {payout.account_id && (
        <SidebarLink
          to={`/payout-accounts/${payout.account_id}`}
          labelKey={t("payouts.fields.payoutAccount")}
          descriptionKey={payout.account_id}
          icon={<CurrencyDollar />}
          dataTestid="payout-reference-payout-account"
        />
      )}
    </Container>
  )
}
