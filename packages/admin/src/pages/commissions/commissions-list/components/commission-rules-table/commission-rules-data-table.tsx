import { PencilSquare, Trash } from "@medusajs/icons";
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
import { StatusCell } from "../../../../../components/table/table-cells/common/status-cell";
import { useCommissionRules } from "../../../../../hooks/api/commissions";
import { useDataTable } from "../../../../../hooks/use-data-table";
import { useDeleteCommissionRuleAction } from "../../../common/hooks/use-delete-commission-rule-action";
import { useScopeReferenceNames } from "../../../common/hooks/use-scope-reference-names";
import { CommissionRate } from "../../../common/types";
import { useCommissionRulesFilters } from "./use-commission-rules-filters";
import { useCommissionRulesQuery } from "./use-commission-rules-query";
import {
  formatCommissionValue,
  getIsActiveProps,
  getScopeSummary,
  getScopeTypeLabel,
} from "../../../common/utils";

const PAGE_SIZE = 20;

export const CommissionRulesDataTable = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = useCommissionRulesQuery({ pageSize: PAGE_SIZE });
  const filters = useCommissionRulesFilters();

  const {
    commission_rates,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useCommissionRules(
    {
      ...searchParams,
      is_default: false,
      fields: "id,name,code,type,value,currency_code,is_enabled,*rules,*values",
    },
    {
      placeholderData: keepPreviousData,
    }
  );

  const data = useMemo(
    () => (commission_rates ?? []) as unknown as CommissionRate[],
    [commission_rates]
  );

  const allRules = useMemo(
    () => data.flatMap((rate) => rate.rules ?? []),
    [data]
  );
  const { names } = useScopeReferenceNames(allRules);

  const columns = useColumns(names);

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
      queryObject={raw}
      filters={filters}
      navigateTo={(row) => `${row.original.id}`}
      noRecords={{
        title: t("commissions.rules.empty.heading"),
        message: t("commissions.rules.empty.description"),
      }}
      pagination
      search
      orderBy={[
        { key: "name", label: t("commissions.rules.columns.rule") },
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

const useColumns = (names: Record<string, string>) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => (
          <TextHeader text={t("commissions.rules.columns.rule")} />
        ),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.display({
        id: "type",
        header: () => (
          <TextHeader text={t("commissions.rules.columns.type")} />
        ),
        cell: ({ row }) => (
          <TextCell text={getScopeTypeLabel(row.original.rules, t)} />
        ),
      }),
      columnHelper.display({
        id: "scope",
        header: () => (
          <TextHeader text={t("commissions.rules.columns.scope")} />
        ),
        cell: ({ row }) => (
          <TextCell text={getScopeSummary(row.original.rules, names)} />
        ),
      }),
      columnHelper.display({
        id: "value",
        header: () => (
          <TextHeader text={t("commissions.rules.columns.value")} />
        ),
        cell: ({ row }) => (
          <TextCell text={formatCommissionValue(row.original)} />
        ),
      }),
      columnHelper.accessor("is_enabled", {
        header: () => (
          <TextHeader text={t("commissions.rules.columns.status")} />
        ),
        cell: ({ getValue }) => {
          const props = getIsActiveProps(getValue(), t);
          return <StatusCell color={props.color}>{props.label}</StatusCell>;
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <CommissionRuleRowActions rule={row.original} />,
      }),
    ],
    [t, names]
  );
};
