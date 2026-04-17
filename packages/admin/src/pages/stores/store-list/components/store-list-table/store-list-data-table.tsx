import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Checkbox, toast, usePrompt } from "@medusajs/ui"

import { PencilSquare, XCircleSolid } from "@medusajs/icons"

import { keepPreviousData } from "@tanstack/react-query"
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"

import { useSellers } from "../../../../../hooks/api/sellers"
import { useSellersTableColumns } from "../../../../../hooks/table/columns/use-seller-table-columns"
import { useSellerTableFilters } from "../../../../../hooks/table/filters"
import { useSellersTableQuery } from "../../../../../hooks/table/query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { SellerDTO, SellerStatus } from "@mercurjs/types"
import { sdk } from "../../../../../lib/client"
import { queryClient } from "../../../../../lib/query-client"
import { sellersQueryKeys } from "../../../../../hooks/api/sellers"
import { useTerminateSeller } from "../../../../../hooks/api/sellers"

const PAGE_SIZE = 10

export const StoreListDataTable = () => {
  const { t } = useTranslation()
  const [selection, setSelection] = useState<RowSelectionState>({})

  const { searchParams, raw } = useSellersTableQuery({
    pageSize: PAGE_SIZE,
  })

  const { sellers, count, isLoading } = useSellers(
    {
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    },
  )

  const columns = useColumns()
  const filters = useSellerTableFilters()

  const { table } = useDataTable({
    data: sellers ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
    enableRowSelection: true,
    rowSelection: {
      state: selection,
      updater: setSelection,
    },
  })

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count ?? 0}
      pageSize={PAGE_SIZE}
      filters={filters}
      isLoading={isLoading}
      queryObject={raw}
      search
      pagination
      navigateTo={(row) => `/stores/${row.original.id}`}
      orderBy={[
        { key: "name", label: t("stores.fields.name") },
        { key: "email", label: t("stores.fields.email") },
        { key: "created_at", label: t("fields.createdAt") },
      ]}
      commands={[
        {
          action: async (selection) => {
            const ids = Object.keys(selection)
            try {
              await Promise.all(
                ids.map((id) =>
                  sdk.admin.sellers.$id.suspend.mutate({ $id: id })
                )
              )
              toast.success(t("stores.actions.suspend.successToast", { count: ids.length }))
            } catch {
              toast.error(t("stores.actions.suspend.errorToast"))
            }
            await queryClient.invalidateQueries({
              queryKey: sellersQueryKeys.lists(),
            })
          },
          label: t("stores.actions.suspend.label"),
          shortcut: "s",
        },
        {
          action: async (selection) => {
            const ids = Object.keys(selection)
            try {
              await Promise.all(
                ids.map((id) =>
                  sdk.admin.sellers.$id.unsuspend.mutate({ $id: id })
                )
              )
              toast.success(t("stores.actions.unsuspend.successToast", { count: ids.length }))
            } catch {
              toast.error(t("stores.actions.unsuspend.errorToast"))
            }
            await queryClient.invalidateQueries({
              queryKey: sellersQueryKeys.lists(),
            })
          },
          label: t("stores.actions.unsuspend.label"),
          shortcut: "u",
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<SellerDTO>()

const StoreActions = ({ seller }: { seller: SellerDTO }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: terminateSeller } = useTerminateSeller(seller.id)

  const handleTerminate = async () => {
    const confirmed = await prompt({
      title: t("stores.actions.terminate.title"),
      description: t("stores.actions.terminate.description"),
      verificationText: seller.email || seller.name,
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!confirmed) {
      return
    }

    await terminateSeller(undefined, {
      onSuccess: () => {
        toast.success(t("stores.actions.terminate.success"))
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/stores/${seller.id}/edit`,
            },
            ...(seller.status !== SellerStatus.TERMINATED
              ? [
                  {
                    icon: <XCircleSolid />,
                    label: t("stores.actions.terminate.label"),
                    onClick: handleTerminate,
                  },
                ]
              : []),
          ],
        },
      ]}
    />
  )
}

const useColumns = () => {
  const base = useSellersTableColumns()

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
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <StoreActions seller={row.original} />,
      }),
    ],
    [base],
  )
}
