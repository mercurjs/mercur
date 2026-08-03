import { useTranslation } from "react-i18next";
import { Heading } from "@medusajs/ui";

export const ReviewListHeader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <Heading>{t("reviews.domain")}</Heading>
      </div>
    </div>
  );
};
