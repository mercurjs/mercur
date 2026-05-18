import { useTranslation } from "react-i18next";

import { PlaceholderCell } from "../../common/placeholder-cell";
import { SellerDTO } from "@mercurjs/types";

type SellerCellProps = {
  sellers?: SellerDTO[];
};

export const SellerCell = ({ sellers }: SellerCellProps) => {
  if (!sellers?.length) {
    return <PlaceholderCell />;
  }

  const first = sellers[0];
  const remaining = sellers.length - 1;

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

export const SellerHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-full items-center">
      <span>{t("fields.store")}</span>
    </div>
  );
};
