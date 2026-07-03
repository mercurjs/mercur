import { Button, Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export const CommissionRulesHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <Heading>{t("commissions.rules.title")}</Heading>
      <Button size="small" variant="secondary" asChild>
        <Link to="create">{t("actions.create")}</Link>
      </Button>
    </div>
  );
};
