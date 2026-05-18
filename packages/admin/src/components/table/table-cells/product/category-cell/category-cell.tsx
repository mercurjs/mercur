import { useTranslation } from "react-i18next";

import { PlaceholderCell } from "../../common/placeholder-cell";
import { ProductCategoryDTO } from "@mercurjs/types";

type CategoryCellProps = {
  categories?: ProductCategoryDTO[];
};

export const CategoryCell = ({ categories }: CategoryCellProps) => {
  if (!categories?.length) {
    return <PlaceholderCell />;
  }

  const first = categories[0];
  const remaining = categories.length - 1;

  return (
    <div className="flex h-full w-full items-center gap-x-1 overflow-hidden">
      <span className="truncate">{first.name}</span>
      {remaining > 0 && (
        <span className="text-ui-fg-muted whitespace-nowrap">
          +{remaining}
        </span>
      )}
    </div>
  );
};

export const CategoryHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.category")}</span>
    </div>
  );
};
