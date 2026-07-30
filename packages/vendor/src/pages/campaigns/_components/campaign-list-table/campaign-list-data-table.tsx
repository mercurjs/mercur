import { PencilSquare, Trash } from "@medusajs/icons";
import { AdminCampaign } from "@medusajs/types";
import { toast, usePrompt } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useExtendableTable, useLinkQuery } from "@mercurjs/dashboard-shared";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ActionMenu } from "@components/common/action-menu";
import { _DataTable } from "@components/table/data-table";
import {
  useCampaigns,
  useDeleteCampaign,
} from "@hooks/api/campaigns";
import { useCampaignTableColumns } from "@hooks/table/columns/use-campaign-table-columns";
import { useCampaignTableFilters } from "@hooks/table/filters/use-campaign-table-filters";
import { useCampaignTableQuery } from "@hooks/table/query/use-campaign-table-query";
import { useDataTable } from "@hooks/use-data-table";

const PAGE_SIZE = 20;

export const CampaignListDataTable = () => {
  const { t } = useTranslation();
  const { raw, searchParams } = useCampaignTableQuery({ pageSize: PAGE_SIZE });
  const linkQuery = useLinkQuery("campaign");

  const {
    campaigns,
    count,
    isPending: isLoading,
    isError,
    error,
  } = useCampaigns(
    { ...searchParams, ...linkQuery },
    {
      placeholderData: keepPreviousData,
    },
  );

  const { columns } = useColumns();
  const filters = useCampaignTableFilters();

  const { table } = useDataTable({
    data: campaigns ?? [],
    columns,
    count,
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
      count={count}
      pageSize={PAGE_SIZE}
      pagination
      search
      filters={filters}
      navigateTo={(row) => row.id}
      isLoading={isLoading}
      queryObject={raw}
      orderBy={[
        { key: "name", label: t("fields.name") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
    />
  );
};

const CampaignActions = ({ campaign }: { campaign: AdminCampaign }) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useDeleteCampaign(campaign.id);

  const handleDelete = async () => {
    const confirm = await prompt({
      title: t("campaigns.delete.title"),
      description: t("campaigns.delete.description", {
        name: campaign.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!confirm) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("campaigns.delete.successToast", { name: campaign.name }),
        );
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
              to: `/campaigns/${campaign.id}/edit`,
            },
          ],
        },
        {
          actions: [
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

const columnHelper = createColumnHelper<AdminCampaign>();

const useColumns = () => {
  const base = useCampaignTableColumns();
  const { columns: extended, filters } = useExtendableTable<AdminCampaign>({
    model: "campaign",
    columns: base as unknown as ColumnDef<AdminCampaign, unknown>[],
  });

  const columns = useMemo(
    () => [
      ...extended,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <CampaignActions campaign={row.original} />;
        },
      }),
    ],
    [extended],
  );

  return { columns, filters };
};
