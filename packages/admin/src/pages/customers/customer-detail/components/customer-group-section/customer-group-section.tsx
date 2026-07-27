import { HttpTypes } from "@medusajs/types"
import {
  Button,
  Checkbox,
  Container,
  Heading,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table"
import { t } from "i18next"
import { useMemo, useState } from "react"

import { PencilSquare, Trash } from "@medusajs/icons"
import { DisplayExtensionZone } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { useBatchCustomerCustomerGroups } from "../../../../../hooks/api"
import {
  useCustomerGroups,
  useRemoveCustomersFromGroup,
} from "../../../../../hooks/api/customer-groups"
import { useCustomerGroupTableColumns } from "../../../../../hooks/table/columns/use-customer-group-table-columns"
import { useCustomerGroupTableFilters } from "../../../../../hooks/table/filters/use-customer-group-table-filters"
import { useCustomerGroupTableQuery } from "../../../../../hooks/table/query/use-customer-group-table-query"
import { useDataTable } from "../../../../../hooks/use-data-table"

const PAGE_SIZE = 10
const PREFIX = "cusgr"
const DEFAULT_ORDER = "-created_at"

export const CustomerGroupSection = ({
  customer,
}: {
  customer: HttpTypes.AdminCustomer
}) => {
  const prompt = usePrompt()

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const { raw, searchParams } = useCustomerGroupTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { customer_groups, count, isLoading, isError, error } =
    useCustomerGroups(
      {
        ...searchParams,
        order: searchParams.order || DEFAULT_ORDER,
        fields: "+customers.id,+seller.id,+seller.name",
        customers: { id: customer.id },
      },
      {
        placeholderData: keepPreviousData,
      }
    )

  const { mutateAsync: batchCustomerCustomerGroups } =
    useBatchCustomerCustomerGroups(customer.id)

  const filters = useCustomerGroupTableFilters()
  const columns = useColumns(customer.id)

  const { table } = useDataTable({
    data: customer_groups ?? [],
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
    const customerGroupIds = Object.keys(rowSelection)
    const selectedGroups =
      customer_groups?.filter((g) => customerGroupIds.includes(g.id)) ?? []
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

    await batchCustomerCustomerGroups(
      { remove: customerGroupIds },
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
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0" data-testid="customer-group-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="customer-group-section-header">
        <Heading level="h2" data-testid="customer-group-section-heading">{t("customerGroups.domain")}</Heading>
        <Link to={`/customers/${customer.id}/add-customer-groups`} data-testid="customer-group-section-add-link">
          <Button variant="secondary" size="small" data-testid="customer-group-section-add-button">
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
        navigateTo={(row) => `/customer-groups/${row.id}`}
        filters={filters}
        search
        pagination
        orderBy={[
          { key: "name", label: t("fields.name") },
          { key: "created_at", label: t("fields.createdAt") },
          { key: "updated_at", label: t("fields.updatedAt") },
        ]}
        defaultOrder={DEFAULT_ORDER}
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
      data-testid={`customer-group-section-row-actions-${group.id}`}
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

// `seller` comes from the Mercur `customer_group_seller` link (requested via
// `+seller.id,+seller.name`); it is not on Medusa's base customer-group type.
type CustomerGroupWithOwner = HttpTypes.AdminCustomerGroup & {
  seller?: { id: string; name: string } | null
}

const columnHelper = createColumnHelper<HttpTypes.AdminCustomerGroup>()

const useColumns = (customerId: string) => {
  const columns = useCustomerGroupTableColumns()

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
        id: "owner",
        header: t("fields.owner"),
        cell: ({ row }) => {
          const seller = (row.original as CustomerGroupWithOwner).seller
          return (
            <span data-testid={`customer-group-section-owner-${row.original.id}`}>
              {seller?.name ?? "-"}
            </span>
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
    [columns, customerId]
  )
}
