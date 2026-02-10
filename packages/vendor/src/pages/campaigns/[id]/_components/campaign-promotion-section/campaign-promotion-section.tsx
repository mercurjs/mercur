import { PencilSquare, Trash } from "@medusajs/icons"
import { AdminCampaign, AdminPromotion } from "@medusajs/types"
import { Button, Checkbox, Container, Heading, usePrompt } from "@medusajs/ui"
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "@components/common/action-menu"
import { _DataTable } from "@components/table/data-table"
import { useRemovePromotionFromCampaign } from "@hooks/api/promotions"
import { fetchQuery } from "@lib/client"
import { queryClient } from "@lib/query-client"
import { campaignsQueryKeys } from "@hooks/api/campaigns"
import { promotionsQueryKeys } from "@hooks/api/promotions"
import { usePromotionTableColumns } from "@hooks/table/columns/use-promotion-table-columns"
import { usePromotionTableFilters } from "@hooks/table/filters/use-promotion-table-filters"
import { usePromotionTableQuery } from "@hooks/table/query/use-promotion-table-query"
import { useDataTable } from "@hooks/use-data-table"

type CampaignPromotionSectionProps = {
  campaign: AdminCampaign & { promotions?: AdminPromotion[] }
}

const PAGE_SIZE = 10

export const CampaignPromotionSection = ({
  campaign,
}: CampaignPromotionSectionProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const { t } = useTranslation()
  const prompt = usePrompt()
  const columns = useColumns()
  const filters = usePromotionTableFilters()
  const { raw } = usePromotionTableQuery({
    pageSize: PAGE_SIZE,
  })

  const promotions = campaign.promotions
  const count = promotions?.length ?? 0

  const { table } = useDataTable({
    data: promotions ?? [],
    columns,
    count,
    getRowId: (row) => row.id,
    enablePagination: true,
    enableRowSelection: true,
    pageSize: PAGE_SIZE,
    rowSelection: {
      state: rowSelection,
      updater: setRowSelection,
    },
    meta: { campaignId: campaign.id },
  })

  const handleRemove = async () => {
    const keys = Object.keys(rowSelection)

    const res = await prompt({
      title: t("campaigns.promotions.remove.title", {
        count: keys.length,
      }),
      description: t("campaigns.promotions.remove.description", {
        count: keys.length,
      }),
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    /* Solution below isn't ideal, we should consider making additional backend logic for assigning/unassigning promotions from campaigns, especially batched */

    await Promise.all(
      keys.map((promotionId) =>
        fetchQuery(`/vendor/promotions/${promotionId}`, {
          method: "POST",
          body: { campaign_id: null },
        })
      )
    )

    queryClient.invalidateQueries({
      queryKey: campaignsQueryKeys.details(),
    })
    queryClient.invalidateQueries({
      queryKey: promotionsQueryKeys.all,
    })

    setRowSelection({})
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("promotions.domain")}</Heading>
        <Link to={`/campaigns/${campaign.id}/add-promotions`}>
          <Button variant="secondary" size="small">
            {t("general.add")}
          </Button>
        </Link>
      </div>

      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        isLoading={false}
        count={count}
        navigateTo={(row) => `/promotions/${row.id}`}
        filters={filters}
        search
        pagination
        orderBy={[
          { key: "code", label: t("fields.code") },
          { key: "type", label: t("fields.type") },
          {
            key: "created_at",
            label: t("fields.createdAt"),
          },
          {
            key: "updated_at",
            label: t("fields.updatedAt"),
          },
        ]}
        queryObject={raw}
        commands={[
          {
            action: handleRemove,
            label: t("actions.remove"),
            shortcut: "r",
          },
        ]}
        noRecords={{
          message: t("campaigns.promotions.list.noRecordsMessage"),
        }}
      />
    </Container>
  )
}

const PromotionActions = ({ promotion }: { promotion: AdminPromotion }) => {
  const { t } = useTranslation()
  const { mutateAsync } = useRemovePromotionFromCampaign(promotion.id)

  const prompt = usePrompt()

  const handleRemove = async () => {
    const res = await prompt({
      title: t("campaigns.promotions.remove.title", {
        count: 1,
      }),
      description: t("campaigns.promotions.remove.description", {
        count: 1,
      }),
      confirmText: t("actions.continue"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync()
  }

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
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.remove"),
              onClick: handleRemove,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<AdminPromotion>()

const useColumns = () => {
  const columns = usePromotionTableColumns()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          )
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation()
              }}
            />
          )
        },
      }),
      ...columns,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <PromotionActions promotion={row.original} />
        },
      }),
    ],
    [columns]
  )
}
