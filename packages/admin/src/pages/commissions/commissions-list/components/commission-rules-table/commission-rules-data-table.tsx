import { PencilSquare, Trash } from "@medusajs/icons";
import { StatusBadge } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "../../../../../components/common/action-menu";
import {
  TextCell,
  TextHeader,
} from "../../../../../components/table/table-cells/common/text-cell";
import { _DataTable } from "../../../../../components/table/data-table";
import { useCommissionRules } from "../../../../../hooks/api/commissions";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { useDeleteCommissionRuleAction } from "../../../common/hooks/use-delete-commission-rule-action";
import { CommissionRate } from "../../../common/types";
import {
  formatCommissionValue,
  getIsActiveProps,
  getScopeSummary,
  getScopeTypeLabel,
} from "../../../common/utils";

const PAGE_SIZE = 20;

export const CommissionRulesDataTable = () => {
  const { t } = useTranslation();

  const {
    commission_rates,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useCommissionRules(
    {
      limit: PAGE_SIZE,
      offset: 0,
      is_default: false,
      fields: "id,name,code,type,value,currency_code,is_enabled,*rules,*values",
    },
    {
      placeholderData: keepPreviousData,
    }
  );

  const columns = useColumns();

  const data = (commission_rates ?? []) as unknown as CommissionRate[];

  const { table } = useDataTable({
    data,
    columns,
    count: count ?? 0,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  });

  if (isError) {
    throw error;
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count ?? 0}
      pageSize={PAGE_SIZE}
      isLoading={isLoading}
      navigateTo={(row) => `${row.original.id}`}
      pagination
      search
      orderBy={[
        { key: "name", label: t("commissions.rules.columns.rule", "Rule") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
    />
  );
};

const CommissionRuleRowActions = ({ rule }: { rule: CommissionRate }) => {
  const { t } = useTranslation();
  const handleDelete = useDeleteCommissionRuleAction(rule);

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `/settings/commissions/${rule.id}/edit`,
              icon: <PencilSquare />,
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              onClick: handleDelete,
              icon: <Trash />,
            },
          ],
        },
      ]}
    />
  );
};

const columnHelper = createColumnHelper<CommissionRate>();

const useColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <TextHeader text={t("commissions.rules.columns.rule", "Rule")} />
        ),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.display({
        id: "type",
        header: () => (
          <TextHeader text={t("commissions.rules.columns.type", "Type")} />
        ),
        cell: ({ row }) => (
          <TextCell text={getScopeTypeLabel(row.original.rules, t)} />
        ),
      }),
      columnHelper.display({
        id: "scope",
        header: () => (
          <TextHeader text={t("commissions.rules.columns.scope", "Scope")} />
        ),
        cell: ({ row }) => <TextCell text={getScopeSummary(row.original.rules)} />,
      }),
      columnHelper.display({
        id: "value",
        header: () => (
          <TextHeader text={t("commissions.rules.columns.value", "Value")} />
        ),
        cell: ({ row }) => (
          <TextCell text={formatCommissionValue(row.original)} />
        ),
      }),
      columnHelper.accessor("is_enabled", {
        header: () => (
          <TextHeader text={t("commissions.rules.columns.status", "Status")} />
        ),
        cell: ({ getValue }) => {
          const props = getIsActiveProps(getValue(), t);
          return (
            <StatusBadge color={props.color}>{props.label}</StatusBadge>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <CommissionRuleRowActions rule={row.original} />,
      }),
    ],
    [t]
  );
};
