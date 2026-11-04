import { ExclamationCircle } from "@medusajs/icons";
import { Tooltip } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { ProductChangeRequestDTO } from "@mercurjs/types";

type ProductChangeRequestIconProps = {
  changeRequest?: ProductChangeRequestDTO | null;
};

export const ProductChangeRequestIcon = ({
  changeRequest,
}: ProductChangeRequestIconProps) => {
  const { t } = useTranslation();

  if (!changeRequest) {
    return null;
  }

  return (
    <Tooltip
      content={changeRequest.message ?? t("products.changeRequest.title")}
    >
      <ExclamationCircle
        className="text-ui-tag-orange-icon shrink-0"
        data-testid="product-change-request-icon"
      />
    </Tooltip>
  );
};
