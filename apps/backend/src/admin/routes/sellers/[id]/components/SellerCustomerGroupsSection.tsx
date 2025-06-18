import { Container, Divider, Heading, usePrompt } from "@medusajs/ui";
import { DataTable } from "../../../../components/table/data-table";
import { createColumnHelper } from "@tanstack/react-table"
import { useDataTable } from "../../../../hooks/table/use-data-table";
import { useMemo } from "react";
import { useSellerOrdersTableQuery } from "../../helpers";
import { ActionsButton } from "../../../../common/ActionsButton";
import { PencilSquare, Trash } from "@medusajs/icons";
import { formatDate } from "../../../../lib/date";
import { useNavigate } from "react-router-dom";
import { mercurQuery } from "../../../../lib/client";
import { toast } from "@medusajs/ui";
import { useCustomerGroupTableFilters } from "../../helpers/use-customer-groups-table-filters";

const PAGE_SIZE = 10
const PREFIX = 'scg'

export const SellerCustomerGroupsSection = ({ seller_customer_groups, refetch }: { seller_customer_groups: any, refetch: () => void }) => {
  const { customer_groups, count } = seller_customer_groups

  const { raw } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
    prefix: PREFIX,
  })

  const columns = useColumns(refetch)
  const filters = useCustomerGroupTableFilters()

  const { table } = useDataTable({
    data: customer_groups,
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row: any) => row?.id || "",
    prefix: PREFIX,
  })


  return (
    <Container className="mt-2 px-0">
      <div className="px-8 pb-4">
        <Heading>Customer Groups</Heading>
      </div>
      <Divider />
      <DataTable
        filters={filters}
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        isLoading={false}
        queryObject={raw}
        search
        pagination
        navigateTo={(row) => `/customer-groups/${row.id}`}
        orderBy={[
          { key: "name", label: "Name" },
          { key: "created_at", label: "Created" },
          { key: "updated_at", label: "Updated" },
        ]}
        prefix={PREFIX}
      />
    </Container>
  )
}

const columnHelper = createColumnHelper<any>()

const useColumns = (refetch: () => void) => {
  const prompt = usePrompt()
  const navigate = useNavigate()

  const handleDelete = async(customer_group: any) => {
    const res = await prompt({
      title: "Are you sure?",
      description:`You are about to delete the customer group ${customer_group.name}. This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!res) {
      return
    }

    try {
      await mercurQuery(`/admin/customer-groups/${customer_group.id}`, {
        method: 'DELETE',
      })
      toast.success("Customer group deleted successfully", {
        description: `${customer_group.name} deleted successfully`,
      })
      await refetch()
    } catch (e:any) {
      toast.error("Error deleting customer group", {
        description: "Please try again later",
      })
    }

  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'name',
        header: 'Name',
        cell: ({ row }) => {
          return     <div className="flex h-full w-full max-w-[250px] items-center gap-x-3 overflow-hidden">
          <span title={row.original.name} className="truncate">
            {row.original.name}
          </span>
        </div>
        }
      }),
      columnHelper.display({
        id: 'customers',
        header: 'Customers',
        cell: ({ row }) => {
          const customers = row.original.customers?.length || 0
          const suffix = customers > 1 ? 'customers' : 'customer'
          
          return `${customers} ${suffix}`
        }
      }),
      columnHelper.display({
        id: 'created',
        header: 'Created',
        cell: ({ row }) => formatDate(row.original.created_at, 'MMM d, yyyy')
      }),
      columnHelper.display({
        id: 'updated',
        header: 'Updated',
        cell: ({ row }) => formatDate(row.original.updated_at, 'MMM d, yyyy')
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => <ActionsButton
        actions={[
          {
            label: "Edit",
            onClick: () => navigate(`/customer-groups/${row.original.id}/edit`),
            icon: <PencilSquare />
          },
          {
            label: "Delete",
            onClick: () => handleDelete(row.original),
            icon: <Trash />
          }
          ]} />
      }),
    ],
    []
  )

  return columns
}