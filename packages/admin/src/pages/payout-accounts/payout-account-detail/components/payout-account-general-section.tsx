import { ArrowPath, ArrowUpRightOnBox, Link as LinkIcon, XCircle } from "@medusajs/icons"
import { Badge, Container, Copy, Heading, StatusBadge, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { SectionRow } from "../../../../components/common/section"
import {
  AdminPayoutAccount,
  useIgnorePayoutAccount,
  useRefreshPayoutAccountLink,
  useSyncPayoutAccount,
} from "../../../../hooks/api/payout-accounts"
import { useDate } from "../../../../hooks/use-date"
import { getPayoutAccountStatusProps } from "../../common/utils"

export const PayoutAccountGeneralSection = ({
  account,
}: {
  account: AdminPayoutAccount
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { getFullDate } = useDate()

  const sync = useSyncPayoutAccount(account.id)
  const refreshLink = useRefreshPayoutAccountLink(account.id)
  const ignore = useIgnorePayoutAccount(account.id)

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

  const handleToggleIgnore = async () => {
    const ignored = !account.ignored

    if (ignored) {
      const confirmed = await prompt({
        title: t("payoutAccounts.ignore.title"),
        description: t("payoutAccounts.ignore.description"),
        confirmText: t("actions.confirm"),
        cancelText: t("actions.cancel"),
      })

      if (!confirmed) {
        return
      }
    }

    ignore.mutate(
      { ignored },
      {
        onSuccess: () =>
          toast.success(
            ignored
              ? t("payoutAccounts.ignore.successToast")
              : t("payoutAccounts.unignore.successToast"),
          ),
        onError: (error) => toast.error(error.message),
      },
    )
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
          {account.ignored && (
            <StatusBadge color="grey">
              {t("payoutAccounts.fields.ignored")}
            </StatusBadge>
          )}
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
              {
                actions: [
                  {
                    label: account.ignored
                      ? t("payoutAccounts.actions.unignore")
                      : t("payoutAccounts.actions.ignore"),
                    icon: <XCircle />,
                    onClick: handleToggleIgnore,
                    permission: "payouts:edit",
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow
        title={t("payoutAccounts.fields.provider")}
        value={<Badge size="2xsmall">{account.provider_id}</Badge>}
      />
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
