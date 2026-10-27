import { Container, Heading, Text, clx } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { AdminPayoutAccount } from "../../../../lib/payouts"
import { getPayoutAccountKycProps } from "../../common/utils"

type Tone = "green" | "orange" | "red" | "blue" | "grey" | "purple"

const barColor: Record<Tone, string> = {
  green: "bg-ui-tag-green-icon",
  orange: "bg-ui-tag-orange-icon",
  red: "bg-ui-tag-red-icon",
  blue: "bg-ui-tag-blue-icon",
  grey: "bg-ui-tag-neutral-icon",
  purple: "bg-ui-tag-purple-icon",
}

const CapabilityCard = ({
  label,
  value,
  tone,
  testId,
}: {
  label: string
  value: string
  tone: Tone
  testId: string
}) => (
  <div
    className="shadow-elevation-card-rest bg-ui-bg-component text-ui-fg-subtle flex items-center gap-x-3 rounded-md px-3 py-1.5"
    data-testid={testId}
  >
    <div className={clx("h-8 w-1 rounded-full", barColor[tone])} />
    <div>
      <Text weight="plus" size="small">
        {label}
      </Text>
      <Text size="small">{value}</Text>
    </div>
  </div>
)

export const PayoutAccountCapabilitiesSection = ({
  account,
}: {
  account: AdminPayoutAccount
}) => {
  const { t } = useTranslation()

  const kyc = getPayoutAccountKycProps(account.kyc_status, t)
  const enabled = (flag: boolean) =>
    flag ? t("payoutAccounts.enabled") : t("payoutAccounts.disabled")

  return (
    <Container
      className="flex flex-col gap-y-4"
      data-testid="payout-account-capabilities-section"
    >
      <div className="flex items-center justify-between">
        <Heading level="h2">{t("payoutAccounts.capabilities.header")}</Heading>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CapabilityCard
          label={t("payoutAccounts.fields.payoutsEnabled")}
          value={enabled(account.payouts_enabled)}
          tone={account.payouts_enabled ? "green" : "orange"}
          testId="payout-account-capabilities-payouts"
        />
        <CapabilityCard
          label={t("payoutAccounts.fields.chargesEnabled")}
          value={enabled(account.charges_enabled)}
          tone={account.charges_enabled ? "green" : "orange"}
          testId="payout-account-capabilities-charges"
        />
        <CapabilityCard
          label={t("payoutAccounts.fields.kycStatus")}
          value={kyc?.label ?? t("payoutAccounts.capabilities.kycUnknown")}
          tone={kyc?.color ?? "grey"}
          testId="payout-account-capabilities-kyc"
        />
        <CapabilityCard
          label={t("payoutAccounts.fields.detailsSubmitted")}
          value={account.details_submitted ? t("general.yes") : t("general.no")}
          tone={account.details_submitted ? "green" : "orange"}
          testId="payout-account-capabilities-details"
        />
      </div>
    </Container>
  )
}
