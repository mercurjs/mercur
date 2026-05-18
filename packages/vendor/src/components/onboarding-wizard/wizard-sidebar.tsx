import { ReactNode } from "react";
import { ChevronLeft } from "@medusajs/icons";
import { Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { TOTAL_STEPS } from "./constants";

type WizardSidebarProps = {
  currentStep: number;
  onBack?: () => void;
  showBack?: boolean;
  children: ReactNode;
};

export const WizardSidebar = ({
  currentStep,
  onBack,
  showBack,
  children,
}: WizardSidebarProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col lg:w-[584px] lg:shrink-0 h-full bg-ui-bg-base border-r border-ui-border-base overflow-y-auto">
      <div className="flex flex-1 flex-col p-8 lg:px-14 lg:py-12">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="txt-compact-small text-ui-fg-base flex items-center gap-x-0.5 font-medium transition-colors hover:text-ui-fg-subtle self-start mb-6"
          >
            <ChevronLeft className="size-4" />
            <span>{t("actions.back")}</span>
          </button>
        )}
        <Text size="small" className="text-ui-fg-subtle mb-1">
          {t("onboarding.wizard.stepOf", {
            current: currentStep + 1,
            total: TOTAL_STEPS,
          })}
        </Text>
        {children}
      </div>
    </div>
  );
};
