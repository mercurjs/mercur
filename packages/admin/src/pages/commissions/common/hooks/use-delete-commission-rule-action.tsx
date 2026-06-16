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
      title: t("general.areYouSure"),
      description: t("commissions.delete.description", {
        name: rule.name,
        defaultValue: `Are you sure you want to delete the commission rule "${rule.name}"?`,
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
          t("commissions.delete.successToast", {
            defaultValue: "Commission rule deleted",
          })
        );
        navigate("/settings/commissions");
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  };
};
