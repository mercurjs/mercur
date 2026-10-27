import { ArrowPath, ArrowUpRightOnBox, Link as LinkIcon } from "@medusajs/icons"
import { Badge, Container, Copy, Heading, StatusBadge, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import { useRefreshPayoutAccountLink, useSyncPayoutAccount } from "../../../../hooks/api/payout-accounts"
import { AdminPayoutAccount } from "../../../../lib/payouts"
import { useDate } from "../../../../hooks/use-date"
import { getPayoutAccountStatusProps } from "../../common/utils"

export const PayoutAccountGeneralSection = ({
  account,
}: {
  account: AdminPayoutAccount
}) => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  const sync = useSyncPayoutAccount(account.id)
  const refreshLink = useRefreshPayoutAccountLink(account.id)

  const status = getPayoutAccountStatusProps(account.status, t)
  const onboardingUrl =
    typeof account.onboarding?.data?.url === "string"
      ? account.onboarding.data.url
      : null

  const handleSync = () => {
    sync.mutate(undefined, {
      onSuccess: () => toast.success(t("payoutAccounts.sync.successToast")),
      onError: (error) => toast.error(error.message),
    })
  }

  const handleRefreshLink = () => {
    refreshLink.mutate(undefined, {
      onSuccess: () =>
        toast.success(t("payoutAccounts.refreshLink.successToast")),
      onError: (error) => toast.error(error.message),
    })
  }

  const formatDate = (value: Date | string | null | undefined) =>
    value ? getFullDate({ date: value, includeTime: true }) : "-"

  return (
    <Container className="divide-y p-0" data-testid="payout-account-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading data-testid="payout-account-general-section-heading">
          {account.seller?.name ?? account.provider_account_id ?? account.id}
        </Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge
            color={status.color}
            data-testid="payout-account-general-section-status-badge"
          >
            {status.label}
          </StatusBadge>
          <ActionMenu
            data-testid="payout-account-general-section-action-menu"
            groups={[
              {
                actions: [
                  {
                    label: t("payoutAccounts.actions.sync"),
                    icon: <ArrowPath />,
                    onClick: handleSync,
                    permission: "payouts:edit",
                  },
                  {
                    label: t("payoutAccounts.actions.refreshLink"),
                    icon: <LinkIcon />,
                    onClick: handleRefreshLink,
                    permission: "payouts:edit",
                  },
                  ...(onboardingUrl
                    ? [
                        {
                          label: t("payoutAccounts.actions.openLink"),
                          icon: <ArrowUpRightOnBox />,
                          onClick: () => window.open(onboardingUrl, "_blank"),
                        },
                      ]
                    : []),
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow
        title={t("payoutAccounts.fields.providerAccountId")}
        value={
          account.provider_account_id ? (
            <Copy
              asChild
              content={account.provider_account_id}
              className="cursor-pointer"
              data-testid="payout-account-general-section-provider-account-copy"
            >
              <Badge size="2xsmall" className="text-ui-tag-neutral-text">
                {account.provider_account_id}
              </Badge>
            </Copy>
          ) : null
        }
      />
      <SectionRow
        title={t("payoutAccounts.fields.lastSyncedAt")}
        value={formatDate(account.last_synced_at)}
      />
      <SectionRow
        title={t("fields.createdAt")}
        value={formatDate(account.created_at)}
      />
      <SectionRow
        title={t("fields.updatedAt")}
        value={formatDate(account.updated_at)}
      />
    </Container>
  )
}
