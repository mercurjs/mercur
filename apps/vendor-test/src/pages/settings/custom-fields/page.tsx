import type { RouteConfig } from "@mercurjs/dashboard-sdk";
import { useTranslation } from "react-i18next";

export const config: RouteConfig = {
  label: "Custom Fields",
};

export default function CustomFieldsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("customFields.title")}</h1>
      <p>{t("customFields.description")}</p>
      <p>{t("customFields.noFields")}</p>
    </div>
  );
}
