import { Container, Heading, DataTable, createDataTableColumnHelper, DataTablePaginationState, DropdownMenu, Button, usePrompt } from "@medusajs/ui"
import { useState } from "react"
import { useDataTable } from "@medusajs/ui"
import { EllipsisHorizontal, PencilSquare, Trash } from "@medusajs/icons"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "@medusajs/ui"
import { AttributeDTO } from "@mercurjs/framework"
import { mercurQuery } from "../../../lib/client"
import { useQueryClient } from "@tanstack/react-query"
import { attributeQueryKeys } from "../../../hooks/api/attributes"

type PossibleValue = { id: string; value: string; rank: number; created_at: string }

type PossibleValuesTableProps = {
  attribute: AttributeDTO
  isLoading: boolean
}

export const PossibleValuesTable = ({ attribute }: PossibleValuesTableProps) => {
  const [possibleValuesPage, setPossibleValuesPage] = useState(1)
  const possibleValuesPageSize = 10
  const [possibleValuesPagination, setPossibleValuesPagination] = useState<DataTablePaginationState>({
    pageIndex: possibleValuesPage - 1,
    pageSize: possibleValuesPageSize,
  })
  const [possibleValuesSearch, setPossibleValuesSearch] = useState("")

  const navigate = useNavigate()
  const { id: attributeId } = useParams()
  const prompt = usePrompt()
  const queryClient = useQueryClient()

  const handleDeleteValue = async (possibleValue: PossibleValue) => {
    const confirmed = await prompt({
      title: "Delete Possible Value",
      description: `You are about to delete the value "${possibleValue.value}" from possible values of attribute "${attribute.name}". This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })

    if (!confirmed || !attributeId) return

    try {
      const updatedPossibleValues = attribute.possible_values?.filter(
        (value: any) => value.id !== possibleValue.id
      ) || []

      // Update the attribute with the filtered possible_values
      await mercurQuery(`/admin/attributes/${attributeId}`, {
        method: 'POST',
        body: {
          possible_values: updatedPossibleValues
        }
      })

      toast.success("Possible value deleted successfully!")

      queryClient.invalidateQueries({
        queryKey: attributeQueryKeys.detail(attributeId)
      })
      queryClient.invalidateQueries({
        queryKey: attributeQueryKeys.list()
      })
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const possibleValuesColumnHelper = createDataTableColumnHelper<PossibleValue>()

  const possibleValuesColumns = [
    possibleValuesColumnHelper.accessor("value", {
      header: "Value",
      cell: (info) => info.getValue(),
    }),
    possibleValuesColumnHelper.accessor("rank", {
      header: "Rank",
      cell: (info) => info.getValue(),
    }),
    possibleValuesColumnHelper.display({
      id: "actions",
      cell: (info) => {
        const possibleValue = info.row.original
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="transparent" size="small">
                  <EllipsisHorizontal />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  onClick={() => {
                    if (attributeId) {
                      navigate(`edit-possible-value?possible_value_id=${possibleValue.id}`)
                    } else {
                      toast.error("Attribute ID not found.")
                    }
                  }}
                > <span className="flex items-center gap-2">
                    <PencilSquare /> Edit</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  onClick={() => handleDeleteValue(possibleValue)}
                > <span className="flex items-center gap-2">
                    <Trash /> Delete</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        )
      },
    }),
  ]

  const possibleValuesTable = useDataTable({
    columns: possibleValuesColumns,
    data: attribute?.possible_values?.filter((value: any) =>
      value.value.toLowerCase().includes(possibleValuesSearch.toLowerCase())
    ).slice(
      possibleValuesPagination.pageIndex * possibleValuesPagination.pageSize,
      (possibleValuesPagination.pageIndex + 1) * possibleValuesPagination.pageSize
    ) || [],
    getRowId: (value) => value.id,
    rowCount: attribute?.possible_values?.length || 0,
    pagination: {
      state: possibleValuesPagination,
      onPaginationChange: (newPagination) => {
        setPossibleValuesPagination(newPagination)
        setPossibleValuesPage(newPagination.pageIndex + 1)
      },
    },
    search: {
      state: possibleValuesSearch,
      onSearchChange: setPossibleValuesSearch,
    },
  })

  if (!attribute.possible_values || attribute.possible_values.length === 0) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Possible Values</Heading>
      </div>
      <div>
        <DataTable instance={possibleValuesTable}>
          <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <DataTable.Search placeholder="Search possible values..." />
          </DataTable.Toolbar>
          <DataTable.Table />
          <DataTable.Pagination />
        </DataTable>
      </div>
    </Container>
  )
} 