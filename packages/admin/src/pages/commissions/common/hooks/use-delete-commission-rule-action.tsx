import { toast, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useDeleteCommissionRule } from "../../../../hooks/api/commissions";

export const useDeleteCommissionRuleAction = (rule: {
  id: string;
  name: string;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();
  const { mutateAsync } = useDeleteCommissionRule(rule.id);

  return async () => {
    const confirmed = await prompt({
      title: t("commissions.delete.title"),
      description: t("commissions.delete.description", {
        name: rule.name,
        defaultValue: `You are about to delete commission rule ${rule.name}. This action cannot be undone.`,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!confirmed) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("commissions.delete.successToast")
        );
        navigate("/settings/commissions");
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  };
};
