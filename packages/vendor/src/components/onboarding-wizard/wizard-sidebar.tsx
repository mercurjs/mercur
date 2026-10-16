import { ReactNode } from "react";
import { ArrowRightOnRectangle, ChevronLeft } from "@medusajs/icons";
import { Text, clx } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { AuthReveal } from "@components/layout/auth-layout";

type WizardSidebarProps = {
  currentStep: number;
  totalSteps: number;
  memberEmail: string;
  onSignOut: () => void;
  onBack?: () => void;
  children: ReactNode;
};

export const WizardSidebar = ({
  currentStep,
  totalSteps,
  memberEmail,
  onSignOut,
  onBack,
  children,
}: WizardSidebarProps) => {
  const { t } = useTranslation();

  return (
    <div className="bg-ui-bg-base border-ui-border-base flex h-full w-full flex-col overflow-y-auto border-r lg:w-[584px] lg:shrink-0">
      <div className="group/auth flex flex-1 flex-col" data-reveal="true">
        <AuthReveal
          order={0}
          className="flex justify-end px-8 pt-8 lg:px-14 lg:pt-12"
        >
          <button
            type="button"
            onClick={onSignOut}
            className="text-ui-fg-base hover:bg-ui-bg-subtle-hover focus-visible:shadow-borders-focus txt-compact-small flex items-center gap-x-2 rounded-md px-2 py-1 outline-none transition-fg active:scale-[0.97] motion-reduce:active:scale-100"
            data-testid="onboarding-sign-out-button"
          >
            <ArrowRightOnRectangle className="text-ui-fg-subtle" />
            <span className="font-medium">
              {t("onboarding.wizard.signOut")}
            </span>
            <span className="text-ui-fg-subtle">({memberEmail})</span>
          </button>
        </AuthReveal>
        <div className="flex flex-1 flex-col px-8 pb-8 lg:px-14 lg:pb-12">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={onBack}
              disabled={!onBack}
              aria-hidden={!onBack}
              tabIndex={onBack ? 0 : -1}
              className={clx(
                "txt-compact-small text-ui-fg-base hover:text-ui-fg-subtle mb-6 flex items-center gap-x-0.5 self-start font-medium transition-[opacity,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100",
                onBack ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              data-testid="onboarding-back-button"
            >
              <ChevronLeft className="size-4" />
              <span>{t("actions.back")}</span>
            </button>
            <AuthReveal order={1}>
              <Text size="small" className="text-ui-fg-subtle mb-1">
                {t("onboarding.wizard.stepOf", {
                  current: currentStep + 1,
                  total: totalSteps,
                })}
              </Text>
            </AuthReveal>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
