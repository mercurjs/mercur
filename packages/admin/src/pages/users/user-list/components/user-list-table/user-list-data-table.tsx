import { useMemo } from "react"

import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table/data-table"
import { DateCell } from "../../../../../components/table/table-cells/common/date-cell"
import { useUsers } from "../../../../../hooks/api/users"
import { useUserTableQuery } from "../../../../../hooks/table/query/use-user-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useUserTableFilters } from "./use-user-table-filters"

const PAGE_SIZE = 20

export const UserListDataTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useUserTableQuery({ pageSize: PAGE_SIZE } as { pageSize: number })
  const { users, count, isPending, isError, error } = useUsers(
    {
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    }
  )

  const filters = useUserTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    data: users ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row.id,
  })

  if (isError) {
    throw error
  }

  return (
    <_DataTable
      table={table}
      columns={columns}
      count={count}
      pageSize={PAGE_SIZE}
      filters={filters}
      search
      pagination
      isLoading={isPending}
      queryObject={raw}
      navigateTo={(row) => `${row.original.id}`}
      orderBy={[
        { key: "email", label: t("fields.email") },
        { key: "first_name", label: t("fields.firstName") },
        { key: "last_name", label: t("fields.lastName") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      noRecords={{
        message: t("users.list.empty.description"),
      }}
    />
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminUser>()

const useColumns = () => {
  const { t } = useTranslation()

  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.email")}</span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{row.original.email}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("first_name", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.firstName")}</span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{row.original.first_name || "-"}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("last_name", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.lastName")}</span>
          </div>
        ),
        cell: ({ row }) => {
          return (
            <div className="flex size-full items-center overflow-hidden">
              <span className="truncate">{row.original.last_name || "-"}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("created_at", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.createdAt")}</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const date = getValue()
          return <DateCell date={date ? new Date(date) : null} />
        },
      }),
      columnHelper.accessor("updated_at", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span>{t("fields.updatedAt")}</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const date = getValue()
          return <DateCell date={date ? new Date(date) : null} />
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <UserActions user={row.original} />
        },
      }),
    ],
    [t]
  )
}

const UserActions = ({ user }: { user: HttpTypes.AdminUser }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              onClick: () => {
                navigate(`${user.id}/edit`)
              },
            },
          ],
        },
      ]}
    />
  )
}
