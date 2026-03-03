import { PencilSquare, Trash } from "@medusajs/icons"
import {
  Badge,
  StatusBadge,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import {
  TextCell,
  TextHeader,
} from "../../../../../components/table/table-cells/common/text-cell"
import { _DataTable } from "../../../../../components/table/data-table"
import {
  useCommissionRates,
  useDeleteCommissionRate,
} from "../../../../../hooks/api/commission-rates"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { CommissionRateDTO } from "@mercurjs/types"

const PAGE_SIZE = 20

export const CommissionRateListDataTable = () => {
  const { t } = useTranslation()

  const { commission_rates, count, isPending: isLoading, isError, error } =
    useCommissionRates(
      {
        limit: PAGE_SIZE,
        offset: 0,
        fields: "*rules",
      },
      {
        placeholderData: keepPreviousData,
      }
    )

  const columns = useColumns()

  const { table } = useDataTable({
    data: (commission_rates ?? []) as CommissionRateDTO[],
    columns,
    count: count ?? 0,
    enablePagination: true,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (isError) {
    throw error
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
        { key: "name", label: "Name" },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
    />
  )
}

const CommissionRateActions = ({
  commissionRate,
}: {
  commissionRate: CommissionRateDTO
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteCommissionRate(commissionRate.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: `Are you sure you want to delete the commission rate "${commissionRate.name}"?`,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success("Commission rate deleted successfully")
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `/settings/commission-rates/${commissionRate.id}/edit`,
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
  )
}

const columnHelper = createColumnHelper<CommissionRateDTO>()

const useColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("code", {
        header: "Code",
        cell: ({ getValue }) => (
          <Badge size="2xsmall" className="uppercase">
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("type", {
        header: () => <TextHeader text="Type" />,
        cell: ({ getValue }) => {
          const type = getValue()
          return <TextCell text={type === "percentage" ? "Percentage" : "Fixed"} />
        },
      }),
      columnHelper.accessor("is_enabled", {
        header: "Status",
        cell: ({ getValue }) => {
          const enabled = getValue()
          return (
            <StatusBadge color={enabled ? "green" : "grey"}>
              {enabled ? "Enabled" : "Disabled"}
            </StatusBadge>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <CommissionRateActions commissionRate={row.original} />
        ),
      }),
    ],
    []
  )
}
