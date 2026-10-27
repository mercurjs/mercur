import { Badge, Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { NoRecords } from "../../../../components/common/empty-table-content"
import { SectionRow } from "../../../../components/common/section"
import { AdminPayoutAccount } from "../../../../lib/payouts"

const RequirementList = ({ items }: { items: string[] }) => {
  if (!items.length) {
    return null
  }

  return items.map((item) => (
    <Badge key={item} size="2xsmall">
      {item}
    </Badge>
  ))
}

export const PayoutAccountRequirementsSection = ({
  account,
}: {
  account: AdminPayoutAccount
}) => {
  const { t } = useTranslation()

  const requirements = account.requirements ?? {
    currently_due: [],
    past_due: [],
    pending_verification: [],
  }

  const total =
    requirements.currently_due.length +
    requirements.past_due.length +
    requirements.pending_verification.length

  return (
    <Container
      className="divide-y p-0"
      data-testid="payout-account-requirements-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">{t("payoutAccounts.requirements.header")}</Heading>
          {total > 0 && (
            <Badge size="2xsmall" color="orange">
              {total}
            </Badge>
          )}
        </div>
      </div>
      {total === 0 ? (
        <div data-testid="payout-account-requirements-no-records">
          <NoRecords
            className="flex h-full flex-col overflow-hidden p-6"
            icon={null}
            title={t("payoutAccounts.requirements.emptyTitle")}
            message={t("payoutAccounts.requirements.emptyMessage")}
          />
        </div>
      ) : (
        <>
          <SectionRow
            title={t("payoutAccounts.requirements.pastDue")}
            value={<RequirementList items={requirements.past_due} />}
          />
          <SectionRow
            title={t("payoutAccounts.requirements.currentlyDue")}
            value={<RequirementList items={requirements.currently_due} />}
          />
          <SectionRow
            title={t("payoutAccounts.requirements.pendingVerification")}
            value={
              <RequirementList items={requirements.pending_verification} />
            }
          />
        </>
      )}
    </Container>
  )
}
