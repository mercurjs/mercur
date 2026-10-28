import { ArrowPath, OpenRectArrowOut } from "@medusajs/icons";
import { Alert, Container, Heading, StatusBadge, Text, toast } from "@medusajs/ui";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { ActionMenu, type Action } from "@components/common/action-menu";
import { SectionRow } from "@components/common/section";
import { useCreatePayoutOnboarding, useMyPayoutAccount } from "@hooks/api/payout-accounts";

type StatusColor = "green" | "orange" | "red" | "blue" | "grey";

const ACCOUNT_STATUS_COLOR: Record<string, StatusColor> = {
  pending: "orange",
  active: "green",
  restricted: "orange",
  rejected: "red",
};

const KYC_STATUS_COLOR: Record<string, StatusColor> = {
  pending_submission: "orange",
  pending_approval: "blue",
  approved: "green",
  refused: "red",
};

// Providers report why payouts are off as a dotted code (`requirements.past_due`,
// `rejected.fraud`, ...); only its family decides the message.
const disabledReasonMessage = (reason: string, t: TFunction) => {
  if (reason === "requirements.past_due") return t("payouts.account.disabled.pastDue");
  if (reason === "requirements.pending_verification") return t("payouts.account.disabled.pendingVerification");
  if (reason.startsWith("requirements.")) return t("payouts.account.disabled.requirements");
  if (reason.startsWith("rejected.")) return t("payouts.account.disabled.rejected");
  if (reason === "under_review" || reason === "listed") return t("payouts.account.disabled.underReview");
  return t("payouts.account.disabled.other");
};

export const PayoutAccountSection = () => {
  const { t } = useTranslation();
  const { payout_account: account, isPending, isError, error } = useMyPayoutAccount();
  const onboarding = useCreatePayoutOnboarding(account?.id ?? "");

  if (isError) {
    throw error;
  }

  if (isPending) {
    return null;
  }

  if (!account) {
    return (
      <Container className="divide-y p-0" data-testid="payout-account-section">
        <div className="px-6 py-4">
          <Heading level="h2">{t("payouts.account.header")}</Heading>
        </div>
        <div className="px-6 py-4">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {t("payouts.account.empty")}
          </Text>
        </div>
      </Container>
    );
  }

  const link = account.onboarding?.data as { url?: string; kind?: string } | null;
  const finishing = !account.details_submitted;

  const actions: Action[] = [];
  if (link?.url) {
    const url = link.url;
    actions.push({
      label: finishing
        ? t("payouts.account.actions.continueOnboarding")
        : t("payouts.account.actions.openDashboard"),
      icon: <OpenRectArrowOut />,
      onClick: () => {
        window.open(url, "_blank", "noreferrer");
      },
    });
  }
  if (finishing) {
    actions.push({
      label: t("payouts.account.actions.refreshLink"),
      icon: <ArrowPath />,
      permission: "payouts:edit",
      onClick: () =>
        onboarding.mutate(undefined, {
          onSuccess: () => toast.success(t("payouts.account.linkReady")),
          onError: (e) => toast.error(e.message),
        }),
    });
  }

  return (
    <div className="flex flex-col gap-y-3">
      {account.disabled_reason && (
        <Alert
          variant={account.disabled_reason.startsWith("rejected.") ? "error" : "warning"}
          data-testid="payout-account-alert"
        >
          {disabledReasonMessage(account.disabled_reason, t)}
        </Alert>
      )}
      <Container className="divide-y p-0" data-testid="payout-account-section">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">{t("payouts.account.header")}</Heading>
          <div className="flex items-center gap-x-2">
            <StatusBadge color={ACCOUNT_STATUS_COLOR[account.status] ?? "grey"}>
              {t(`payouts.account.status.${account.status}`)}
            </StatusBadge>
            {actions.length > 0 && (
              <ActionMenu data-testid="payout-account-actions" groups={[{ actions }]} />
            )}
          </div>
        </div>
        <SectionRow
          title={t("payouts.account.fields.payouts")}
          value={account.payouts_enabled ? t("payouts.account.enabled") : t("payouts.account.notEnabled")}
        />
        <SectionRow
          title={t("payouts.account.fields.kycStatus")}
          value={
            account.kyc_status ? (
              <StatusBadge color={KYC_STATUS_COLOR[account.kyc_status] ?? "grey"}>
                {t(`payouts.account.kyc.${account.kyc_status}`)}
              </StatusBadge>
            ) : (
              "-"
            )
          }
        />
      </Container>
    </div>
  );
};
