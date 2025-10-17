import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

import {
  TextCell,
  TextHeader,
} from "../../../components/table/table-cells/common/text-cell";
import { StatusCell } from "../../../components/table/table-cells/common/status-cell";
import { CommissionActionMenu } from "../../../routes/commission/components/commission-actions";
import { AdminCommissionAggregate } from "../../../routes/commission/types";

const columnHelper = createColumnHelper<AdminCommissionAggregate>();

export const useCommissionRulesTableColumns = ({
  onSuccess,
}: {
  onSuccess?: () => void;
}) => {
  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => <TextHeader text={"Rule Name"} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("reference", {
        header: () => <TextHeader text={"Type"} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("ref_value", {
        header: () => <TextHeader text={"Attribute"} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("fee_value", {
        header: () => <TextHeader text={"Fee"} />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("is_active", {
        header: () => <TextHeader text={"Status"} />,
        cell: ({ getValue }) => {
          const value = getValue();
          return (
            <StatusCell color={value ? "green" : "grey"}>
              {value ? "Enabled" : "Disabled"}
            </StatusCell>
          );
        },
      }),
      columnHelper.accessor("id", {
        header: () => <TextHeader text={"Status"} />,
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
    [],
  );
};
