import { PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Container,
  Heading,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { createColumnHelper } from "@tanstack/react-table"
import { Children, ReactNode, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import {
  useCustomerGroups,
  useDeleteCustomerGroupLazy,
} from "../../../../../hooks/api"
import { useCustomerGroupTableFilters } from "../../../../../hooks/table/filters/use-customer-group-table-filters"
import { useCustomerGroupTableQuery } from "../../../../../hooks/table/query/use-customer-group-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useDate } from "../../../../../hooks/use-date"

const PAGE_SIZE = 10

export const CustomerGroupListTitle = () => {
  const { t } = useTranslation()
  return (
    <Heading data-testid="customer-group-list-heading">
      {t("customerGroups.domain")}
    </Heading>
  )
}

export const CustomerGroupListCreateButton = () => {
  const { t } = useTranslation()
  return (
    <Link to="/customer-groups/create">
      <Button size="small" variant="secondary">
        {t("actions.create")}
      </Button>
    </Link>
  )
}

export const CustomerGroupListActions = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="flex items-center gap-x-2">
      {Children.count(children) > 0 ? children : <CustomerGroupListCreateButton />}
    </div>
  )
}

export const CustomerGroupListHeader = ({ children }: { children?: ReactNode }) => {
  return (
    <div
      className="flex items-center justify-between px-6 py-4"
      data-testid="customer-group-list-header"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CustomerGroupListTitle />
          <CustomerGroupListActions />
        </>
      )}
    </div>
  )
}

export const CustomerGroupListDataTable = () => {
  const { t } = useTranslation()

  const { searchParams, raw } = useCustomerGroupTableQuery({ pageSize: PAGE_SIZE })

  const { customer_groups, count, isPending, isError, error } =
    useCustomerGroups(
      {
        ...searchParams,
        fields: "id,name,created_at,updated_at,customers.id",
      },
      {
        placeholderData: keepPreviousData,
      },
    )

  const filters = useCustomerGroupTableFilters()
  const columns = useColumns()

  const { table } = useDataTable({
    data: customer_groups ?? [],
    columns,
    count,
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
      pageSize={PAGE_SIZE}
      count={count}
      isLoading={isPending}
      navigateTo={(row) => `/customer-groups/${row.original.id}`}
      search
      filters={filters}
      queryObject={raw}
      orderBy={[
        { key: "name", label: t("fields.name") },
        { key: "created_at", label: t("fields.createdAt") },
        { key: "updated_at", label: t("fields.updatedAt") },
      ]}
      noRecords={{
        message: t("customerGroups.list.empty.heading"),
      }}
    />
  )
}

export const CustomerGroupListTable = ({ children }: { children?: ReactNode }) => {
  return (
    <Container
      className="divide-y p-0"
      data-testid="customer-group-list-container"
    >
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <CustomerGroupListHeader />
          <CustomerGroupListDataTable />
        </>
      )}
    </Container>
  )
}

const CustomerGroupActions = ({
  group,
}: {
  group: HttpTypes.AdminCustomerGroup
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync: deleteCustomerGroup } = useDeleteCustomerGroupLazy()

  const handleDelete = useCallback(async () => {
    const res = await prompt({
      title: t("customerGroups.delete.title"),
      description: t("customerGroups.delete.description", {
        name: group.name,
      }),
      verificationText: group.name ?? undefined,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await deleteCustomerGroup(
      { id: group.id },
      {
        onSuccess: () => {
          toast.success(
            t("customerGroups.delete.successToast", { name: group.name })
          )
        },
        onError: (e) => {
          toast.error(e.message)
        },
      },
    )
  }, [t, prompt, deleteCustomerGroup, group])

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/customer-groups/${group.id}/edit`,
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
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminCustomerGroup>()

const useColumns = () => {
  const { t } = useTranslation()
  const { getFullDate } = useDate()

  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("fields.name"),
      }),
      columnHelper.display({
        id: "customers",
        header: t("customers.domain"),
        cell: ({ row }) => {
          return <span>{row.original.customers?.length ?? 0}</span>
        },
      }),
      columnHelper.accessor("created_at", {
        header: t("fields.createdAt"),
        cell: ({ row }) => {
          return (
            <span>
              {getFullDate({
                date: row.original.created_at,
                includeTime: true,
              })}
            </span>
          )
        },
      }),
      columnHelper.accessor("updated_at", {
        header: t("fields.updatedAt"),
        cell: ({ row }) => {
          return (
            <span>
              {getFullDate({
                date: row.original.updated_at,
                includeTime: true,
              })}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => <CustomerGroupActions group={row.original} />,
      }),
    ],
    [t, getFullDate]
  )
}
