import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { createColumnHelper } from "@tanstack/react-table";

import { StatusCell } from "@/components/table/table-cells/common/status-cell";
import {
  TextCell,
  TextHeader,
} from "@/components/table/table-cells/common/text-cell";
import { CommissionActionMenu } from "@/pages/commission/components/commission-actions";
import type { AdminCommissionAggregate } from "@/types/commission";

const columnHelper = createColumnHelper<AdminCommissionAggregate>();

export const useCommissionRulesTableColumns = ({
  onSuccess,
}: {
  onSuccess?: () => void;
}) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => <TextHeader text={t("commissions.rulesTable.name")} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("reference", {
        header: () => <TextHeader text={t("fields.type")} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("ref_value", {
        header: () => <TextHeader text={t("commissions.rulesTable.attribute")} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("fee_value", {
        header: () => <TextHeader text={t("commissions.rulesTable.fee")} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("is_active", {
        header: () => <TextHeader text={t("fields.status")} />,
        cell: ({ getValue }) => {
          const value = getValue();

          return (
            <StatusCell color={value ? "green" : "grey"}>
              {value ? t("general.enabled") : t("general.disabled")}
            </StatusCell>
          );
        },
      }),
      columnHelper.accessor("id", {
        header: () => <TextHeader text={t("fields.status")} />,
        cell: (props) => {
          return (
            <CommissionActionMenu
              id={props.row.original.id!}
              is_active={props.row.original.is_active!}
              onSuccess={onSuccess}
            />
          );
        },
      }),
    ],
    [onSuccess, t],
  );
};
