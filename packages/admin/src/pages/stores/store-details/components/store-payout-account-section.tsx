import { CurrencyDollar } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SidebarLink } from "../../../../components/common/sidebar-link/sidebar-link"
import { usePayoutAccounts } from "../../../../hooks/api/payout-accounts"
import { getPayoutAccountStatusProps } from "../../../payout-accounts/common/utils"

export const StorePayoutAccountSection = ({ sellerId }: { sellerId: string }) => {
  const { t } = useTranslation()
  const { payout_accounts, isPending } = usePayoutAccounts({
    seller_id: sellerId,
    limit: 1,
  })

  if (isPending) {
    return null
  }

  const account = payout_accounts?.[0]
  const status = account ? getPayoutAccountStatusProps(account.status, t) : null

  return (
    <Container className="p-0" data-testid="store-payout-account-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("payoutAccounts.storeSection.header")}</Heading>
        {status && (
          <StatusBadge color={status.color} data-testid="store-payout-account-status">
            {status.label}
          </StatusBadge>
        )}
      </div>
      {account ? (
        <SidebarLink
          to={`/payout-accounts/${account.id}`}
          labelKey={t("payouts.fields.payoutAccount")}
          descriptionKey={account.external_id ?? account.id}
          icon={<CurrencyDollar />}
          dataTestid="store-payout-account-link"
        />
      ) : (
        <div className="border-t px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("payoutAccounts.storeSection.empty")}
          </Text>
        </div>
      )}
    </Container>
  )
}
