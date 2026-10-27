import { ArrowPath, OpenRectArrowOut } from "@medusajs/icons"
import { Button, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui"
import { SectionRow } from "@mercurjs/dashboard-shared"

import { useRefreshMyOnboarding } from "../../../../hooks/api/stripe"
import type { VendorAccount } from "../../../../lib/client"
import { ACCOUNT_STATUS_COLOR, KYC_STATUS_COLOR, KYC_STATUS_LABEL, formatDate } from "../../../../lib/status"

const Requirements = ({ label, items }: { label: string; items: string[] }) =>
  items.length ? (
    <SectionRow
      title={label}
      value={
        <ul className="list-disc pl-4">
          {items.map((item) => (
            <li key={item}>{item.replace(/_/g, " ").replace(/\./g, " › ")}</li>
          ))}
        </ul>
      }
    />
  ) : null

export const StatusCard = ({ account }: { account: VendorAccount }) => {
  const refresh = useRefreshMyOnboarding()
  const link = account.onboarding?.data as { url?: string; kind?: string } | null
  const onboarding = !account.details_submitted

  return (
    <Container className="divide-y p-0" data-testid="stripe-status-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{onboarding ? "Finish onboarding on Stripe" : "Your Stripe account"}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {onboarding
              ? "Stripe needs a few details before payouts can start. The link expires, so refresh it if it stops working."
              : "Payouts land on this account and go to your bank on the marketplace's schedule."}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={ACCOUNT_STATUS_COLOR[account.status] ?? "grey"}>{account.status}</StatusBadge>
          {link?.url ? (
            <Button size="small" asChild data-testid="stripe-open-link">
              <a href={link.url} target="_blank" rel="noreferrer">
                <OpenRectArrowOut />
                {onboarding ? "Continue on Stripe" : "Open Stripe dashboard"}
              </a>
            </Button>
          ) : null}
          {onboarding ? (
            <Button
              size="small"
              variant="secondary"
              isLoading={refresh.isPending}
              onClick={() =>
                refresh.mutate(account.id, {
                  onSuccess: () => toast.success("New link ready"),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              <ArrowPath />
              Refresh link
            </Button>
          ) : null}
        </div>
      </div>
      <SectionRow title="Account id" value={account.provider_account_id ?? "-"} />
      <SectionRow title="Verification" value={account.kyc_status ? <StatusBadge color={KYC_STATUS_COLOR[account.kyc_status] ?? "grey"}>{KYC_STATUS_LABEL[account.kyc_status]}</StatusBadge> : "Not started"} />
      <SectionRow title="Payouts enabled" value={account.payouts_enabled ? "Yes" : "Not yet"} />
      <SectionRow title="Charges enabled" value={account.charges_enabled ? "Yes" : "Not yet"} />
      {account.disabled_reason ? <SectionRow title="Stripe says" value={account.disabled_reason.replace(/_/g, " ")} /> : null}
      <Requirements label="Stripe still needs" items={account.requirements?.currently_due ?? []} />
      <Requirements label="Overdue" items={account.requirements?.past_due ?? []} />
      <Requirements label="Being verified" items={account.requirements?.pending_verification ?? []} />
      <SectionRow title="Last checked" value={formatDate(account.last_synced_at)} />
    </Container>
  )
}
