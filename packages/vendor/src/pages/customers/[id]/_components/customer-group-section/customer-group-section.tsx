import { HttpTypes } from "@medusajs/types"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import {
  Button,
  Checkbox,
  Container,
  Heading,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table"
import { t } from "i18next"
import { useMemo, useState } from "react"

import { PencilSquare, Trash } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "@components/common/action-menu"
import { _DataTable } from "@components/table/data-table"
import {
  TextCell,
  TextHeader,
} from "@components/table/table-cells/common/text-cell"
import { useBatchCustomerCustomerGroups } from "@hooks/api"
import {
  useCustomerGroups,
  useRemoveCustomersFromGroup,
} from "@hooks/api/customer-groups"
import { useCustomerGroupTableFilters } from "@hooks/table/filters/use-customer-group-table-filters"
import { useCustomerGroupTableQuery } from "@hooks/table/query/use-customer-group-table-query"
import { useDataTable } from "@hooks/use-data-table"

type CustomerGroupSectionProps = {
  customer: HttpTypes.AdminCustomer
}

const PAGE_SIZE = 10
const PREFIX = "cusgr"
const DEFAULT_ORDER = "-created_at"

export const CustomerGroupSection = ({
  customer,
}: CustomerGroupSectionProps) => {
  const prompt = usePrompt()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const { searchParams, raw } = useCustomerGroupTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const flatCustomerGroups = customer.groups ?? []
  const groupIds = useMemo(
    () => (customer.groups ?? []).map((g) => g.id),
    [customer.groups]
  )

  // Search and ordering are delegated to the backend: we scope the customer
  // groups list to the groups this customer belongs to (`id`) and let the API
  // apply `q`, `order` and pagination.
  const {
    customer_groups: customerGroups = [],
    count = 0,
    isLoading,
    isError,
    error,
  } = useCustomerGroups(
    {
      ...searchParams,
      id: groupIds,
      order: searchParams.order || DEFAULT_ORDER,
      fields: "id,name,created_at,updated_at,customers.id",
    },
    {
      enabled: groupIds.length > 0,
      placeholderData: keepPreviousData,
    }
  )

  if (isError) {
    throw error
  }

  const customerCountByGroup: Record<string, number> = {}
  for (const g of customerGroups) {
    customerCountByGroup[g.id] = g.customers?.length ?? 0
  }

  const { mutateAsync: batchCustomerCustomerGroups } =
    useBatchCustomerCustomerGroups(customer.id)

  const filters = useCustomerGroupTableFilters()
  const columns = useColumns(customer.id, customerCountByGroup)

  const { table } = useDataTable({
    data: customerGroups,
    columns,
    count,
    getRowId: (row) => row.id,
    enablePagination: true,
    enableRowSelection: true,
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
    rowSelection: {
      state: rowSelection,
      updater: setRowSelection,
    },
  })

  const handleRemove = async () => {
    const selectedIds = Object.keys(rowSelection)
    const selectedGroups = flatCustomerGroups.filter((g) =>
      selectedIds.includes(g.id)
    )
    const names = selectedGroups.map((g) => g.name)
    const isSingle = selectedGroups.length === 1

    const res = await prompt({
      title: t("customers.groups.removeTitle"),
      description: isSingle
        ? t("customers.groups.remove", { name: names[0] })
        : t("customers.groups.removeMany", { groups: names.join(", ") }),
      confirmText: t("actions.remove"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    const customerGroupIds = selectedGroups.map((g) => g.id)

    await batchCustomerCustomerGroups(
      { remove: customerGroupIds, add: [] },
      {
        onSuccess: () => {
          toast.success(
            isSingle
              ? t("customers.groups.removed.successOne", { groups: names[0] })
              : t("customers.groups.removed.successMany", {
                  groups: names.join(", "),
                })
          )
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("customerGroups.domain")}</Heading>
        <Link to={`/customers/${customer.id}/add-customer-groups`}>
          <Button variant="secondary" size="small">
            {t("general.add")}
          </Button>
        </Link>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        isLoading={isLoading}
        count={count}
        prefix={PREFIX}
        navigateTo={(row) => `/customer-groups/${row.original.id}`}
        filters={filters}
        search
        pagination
        orderBy={[
          { key: "name", label: t("fields.name") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        defaultOrderBy={DEFAULT_ORDER}
        commands={[
          {
            action: handleRemove,
            label: t("actions.remove"),
            shortcut: "r",
          },
        ]}
        queryObject={raw}
        noRecords={{
          title: t("customers.groups.list.emptyTitle"),
          message: t("customers.groups.list.noRecordsMessage"),
          icon: null,
        }}
      />
      <DisplayExtensionZone model="customer" zone="groups" data={customer} />
    </Container>
  )
}

const CustomerGroupRowActions = ({
  group,
  customerId,
}: {
  group: HttpTypes.AdminCustomerGroup
  customerId: string
}) => {
  const prompt = usePrompt()
  const { t } = useTranslation()

  const { mutateAsync } = useRemoveCustomersFromGroup(group.id)

  const onRemove = async () => {
    const res = await prompt({
      title: t("customers.groups.removeTitle"),
      description: t("customers.groups.remove", {
        name: group.name,
      }),
      confirmText: t("actions.remove"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync([customerId], {
      onSuccess: () => {
        toast.success(
          t("customers.groups.removed.successOne", { groups: group.name })
        )
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
              label: t("actions.edit"),
              icon: <PencilSquare />,
              to: `/customer-groups/${group.id}/edit`,
            },
            {
              label: t("actions.remove"),
              onClick: onRemove,
              icon: <Trash />,
            },
          ],
        },
      ]}
    />
  )
}

const columnHelper = createColumnHelper<HttpTypes.AdminCustomerGroup>()

const useColumns = (
  customerId: string,
  customerCountByGroup: Record<string, number> = {}
) => {
  const { t } = useTranslation()

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
      columnHelper.accessor("name", {
        header: () => <TextHeader text={t("fields.name")} />,
        cell: ({ row }) => {
          return <TextCell text={row.original?.name || "-"} />
        },
      }),
      columnHelper.display({
        id: "customers",
        header: () => <TextHeader text={t("customers.domain")} />,
        cell: ({ row }) => {
          return (
            <TextCell text={`${customerCountByGroup[row.original.id] ?? 0}`} />
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <CustomerGroupRowActions
            group={row.original}
            customerId={customerId}
          />
        ),
      }),
    ],
    [customerId, t, customerCountByGroup]
  )
}
