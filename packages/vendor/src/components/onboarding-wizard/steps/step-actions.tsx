import { Button } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

type StepActionsProps = {
  onSkip?: () => void;
  isLast: boolean;
  isPending?: boolean;
};

export const StepActions = ({ onSkip, isLast, isPending }: StepActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-y-2">
      <Button
        type="submit"
        className="w-full"
        isLoading={isPending}
        data-testid="onboarding-continue-button"
      >
        {isLast ? t("onboarding.wizard.finish") : t("actions.continue")}
      </Button>
      {onSkip && (
        <Button
          type="button"
          variant="transparent"
          className="w-full"
          onClick={onSkip}
          disabled={isPending}
          data-testid="onboarding-skip-button"
        >
          {t("onboarding.wizard.skip")}
        </Button>
      )}
    </div>
  );
};
