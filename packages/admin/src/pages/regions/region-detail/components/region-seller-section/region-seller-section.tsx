import { PlusMini, Trash } from "@medusajs/icons"
import type { HttpTypes } from "@medusajs/types"
import { Checkbox, Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  type RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { SellerDTO } from "@mercurjs/types"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { useBatchRegionSellers } from "../../../../../hooks/api/regions"
import { useSellers } from "../../../../../hooks/api/sellers"
import { useSellersTableColumns } from "../../../../../hooks/table/columns/use-seller-table-columns"
import { useSellersTableQuery } from "../../../../../hooks/table/query"
import { useDataTable } from "../../../../../hooks/use-data-table"

type RegionSellerSectionProps = {
  region: HttpTypes.AdminRegion
}

const PREFIX = "rs"
const PAGE_SIZE = 10

export const RegionSellerSection = ({ region }: RegionSellerSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useSellersTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { sellers, count, isPending, isError, error } = useSellers(
    { ...searchParams, region_id: region.id },
    { placeholderData: keepPreviousData }
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: sellers ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    rowSelection: {
      state: rowSelection,
      updater: setRowSelection,
    },
    prefix: PREFIX,
    meta: {
      regionId: region.id,
    },
  })

  const { mutateAsync } = useBatchRegionSellers(region.id)

  const handleRemoveSellers = async () => {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k])

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("regions.sellers.removeWarning", {
        count: ids.length,
      }),
      cancelText: t("actions.cancel"),
      confirmText: t("actions.remove"),
    })

    if (!res) {
      return
    }

    await mutateAsync(
      { remove: ids },
      {
        onSuccess: () => {
          toast.success(t("regions.sellers.toast.removed"))
          setRowSelection({})
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  }

  if (isError) {
    throw error
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="region-seller-section-container"
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        data-testid="region-seller-section-header"
      >
        <Heading level="h2" data-testid="region-seller-section-heading">
          {t("regions.sellers.header")}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  permission: "regions:edit",
                  label: t("regions.sellers.add"),
                  icon: <PlusMini />,
                  to: "sellers/add",
                },
              ],
            },
          ]}
          data-testid="region-seller-section-action-menu"
        />
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={count ?? 0}
        isLoading={isPending}
        search
        pagination
        queryObject={raw}
        prefix={PREFIX}
        navigateTo={(row) => `/stores/${row.original.id}`}
        commands={[
          {
            action: handleRemoveSellers,
            permission: "regions:edit",
            label: t("actions.remove"),
            shortcut: "r",
          },
        ]}
        noRecords={{
          message: t("regions.sellers.empty"),
        }}
        data-testid="region-seller-section-table"
      />
    </Container>
  )
}

const SellerActions = ({
  seller,
  regionId,
}: {
  seller: SellerDTO
  regionId: string
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useBatchRegionSellers(regionId)

  const handleRemove = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("regions.sellers.removeWarning", { count: 1 }),
      cancelText: t("actions.cancel"),
      confirmText: t("actions.remove"),
    })

    if (!res) {
      return
    }

    await mutateAsync(
      { remove: [seller.id] },
      {
        onSuccess: () => {
          toast.success(t("regions.sellers.toast.removed"))
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <Trash />,
              permission: "regions:edit",
              label: t("actions.remove"),
              onClick: handleRemove,
            },
          ],
        },
      ]}
      data-testid={`region-seller-section-row-action-menu-${seller.id}`}
    />
  )
}

const columnHelper = createColumnHelper<SellerDTO>()

const useColumns = () => {
  const base = useSellersTableColumns()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            data-testid="region-seller-section-select-all-checkbox"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(e) => {
              e.stopPropagation()
            }}
            data-testid={`region-seller-section-select-checkbox-${row.original.id}`}
          />
        ),
      }),
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row, table }) => {
          const { regionId } = table.options.meta as { regionId: string }

          return <SellerActions seller={row.original} regionId={regionId} />
        },
      }),
    ],
    [base]
  )
}
