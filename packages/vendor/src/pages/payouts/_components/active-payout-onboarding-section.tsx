import { ExclamationCircleSolid } from "@medusajs/icons";
import { Button, Container, Heading, Text, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { PermissionAction } from "@mercurjs/dashboard-shared";
import { useCreatePayoutOnboarding, useMyPayoutAccount } from "@hooks/api/payout-accounts";

type OnboardingLink = { url?: string; kind?: string } | null | undefined;

type OnboardingAccount = {
  status: string;
  details_submitted: boolean;
};

export const isOnboardingPending = (account: OnboardingAccount) =>
  account.status === "pending" && !account.details_submitted;

const openLink = (url: string) => {
  window.open(url, "_blank", "noreferrer");
};

export const ActivePayoutOnboardingSection = () => {
  const { t } = useTranslation();
  const { payout_account: account } = useMyPayoutAccount();
  const onboarding = useCreatePayoutOnboarding(account?.id ?? "");

  if (!account || !isOnboardingPending(account)) {
    return null;
  }

  const link = account.onboarding?.data as OnboardingLink;

  const onContinue = async () => {
    if (link?.url && link.kind !== "login") {
      openLink(link.url);
      return;
    }

    await onboarding.mutateAsync(undefined, {
      onSuccess: ({ onboarding }) => {
        const url = (onboarding.data as OnboardingLink)?.url;
        if (url) {
          openLink(url);
        } else {
          toast.success(t("payouts.account.linkReady"));
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <div
      style={{
        background:
          "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
      }}
      className="-m-4 mb-1 border-b border-l p-4"
      data-testid="active-payout-onboarding-section"
    >
      <Container className="flex items-center justify-between p-0">
        <div className="flex w-full flex-row justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 px-6 pt-4">
              <ExclamationCircleSolid className="text-blue-500" />
              <Heading level="h2">{t("payouts.account.onboardingPanel.title")}</Heading>
            </div>

            <div className="gap-2 px-6 pb-4">
              <Text>{t("payouts.account.onboardingPanel.description")}</Text>
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-2 rounded-b-xl px-4 py-4">
            <PermissionAction permission="payouts:edit">
              <Button
                size="small"
                variant="secondary"
                onClick={onContinue}
                isLoading={onboarding.isPending}
                data-testid="active-payout-onboarding-continue"
              >
                {t("payouts.account.actions.continueOnboarding")}
              </Button>
            </PermissionAction>
          </div>
        </div>
      </Container>
    </div>
  );
};
