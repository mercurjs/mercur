import { PencilSquare, ReceiptPercent, Trash } from "@medusajs/icons";
import { HttpTypes } from "@medusajs/types";
import { toast, usePrompt } from "@medusajs/ui";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useExtendableTable, useLinkQuery } from "@mercurjs/dashboard-shared";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";

import { ActionMenu } from "@components/common/action-menu";
import { _DataTable } from "@components/table/data-table";
import {
  useDeletePromotion,
  usePromotions,
} from "@hooks/api/promotions";
import { usePromotionTableColumns } from "@hooks/table/columns/use-promotion-table-columns";
import { usePromotionTableFilters } from "@hooks/table/filters/use-promotion-table-filters";
import { usePromotionTableQuery } from "@hooks/table/query/use-promotion-table-query";
import { useDataTable } from "@hooks/use-data-table";

const PAGE_SIZE = 20;

export const PromotionListDataTable = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = usePromotionTableQuery({
    pageSize: PAGE_SIZE,
  });
  const linkQuery = useLinkQuery("promotion", "+status");
  const {
    promotions: data,
    count,
    isLoading,
    isError,
    error,
  } = usePromotions({
    ...linkQuery,
    ...searchParams,
  });

  const promotions = data?.filter((item) => item !== null);

  const baseFilters = usePromotionTableFilters();
  const { columns, filters: extFilters } = useColumns();
  const filters = useMemo(
    () => [...baseFilters, ...(extFilters as typeof baseFilters)],
    [baseFilters, extFilters],
  );

  const { table } = useDataTable({
    data: (promotions ?? []) as HttpTypes.AdminPromotion[],
    columns: columns as any,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
  });

  if (isError) {
    throw error;
  }

  return (
    <>
      <_DataTable
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        filters={filters}
        search
        pagination
        isLoading={isLoading}
        queryObject={raw}
        noRecords={{
          icon: <ReceiptPercent className="text-ui-fg-subtle" />,
          title: t("promotions.list.noRecords.title"),
          message: t("promotions.list.noRecords.message"),
          action: { to: "create", label: t("actions.create") },
        }}
        navigateTo={(row) => `${row.original.id}`}
        defaultOrderBy="-created_at"
        orderBy={[
          {
            key: "created_at",
            label: t("fields.createdAt"),
          },
          {
            key: "updated_at",
            label: t("fields.updatedAt"),
          },
        ]}
      />
      <Outlet />
    </>
  );
};

const PromotionActions = ({
  promotion,
}: {
  promotion: HttpTypes.AdminPromotion;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();
  const { mutateAsync } = useDeletePromotion(promotion.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("promotions.deleteWarning", {
        code: promotion.code!,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      verificationInstruction: t("general.typeToConfirm"),
      verificationText: promotion.code,
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("promotions.toasts.promotionDeleteSuccess", {
            code: promotion.code,
          }),
        );
        navigate("/promotions", { replace: true });
      },
      onError: (e) => {
        toast.error(e.message);
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/promotions/${promotion.id}/edit`,
            },
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  );
};

const columnHelper = createColumnHelper<HttpTypes.AdminPromotion>();

const useColumns = () => {
  const base = usePromotionTableColumns();
  const { columns: extended, filters } =
    useExtendableTable<HttpTypes.AdminPromotion>({
      model: "promotion",
      columns: base as unknown as ColumnDef<
        HttpTypes.AdminPromotion,
        unknown
      >[],
    });

  const columns = useMemo(
    () => [
      ...extended,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <PromotionActions promotion={row.original} />;
        },
      }),
    ],
    [extended],
  );

  return { columns, filters };
};
