import { HttpTypes } from "@medusajs/types";
import { getPromotionStatus } from "../../../../../lib/promotions";
import { DataTableStatusCell } from "@/components/data-table/components/data-table-status-cell/data-table-status-cell";

type PromotionCellProps = {
  promotion: HttpTypes.AdminPromotion;
};

export const StatusCell = ({ promotion }: PromotionCellProps) => {
  const [color, text] = getPromotionStatus(promotion);

  return <DataTableStatusCell color={color}>{text}</DataTableStatusCell>;
};
