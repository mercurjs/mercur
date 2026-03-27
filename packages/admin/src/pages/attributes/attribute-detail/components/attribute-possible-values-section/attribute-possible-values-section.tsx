import { PencilSquare } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { AttributeDTO, AttributePossibleValueDTO } from "@mercurjs/types"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { _DataTable } from "../../../../../components/table/data-table"
import { DateCell } from "../../../../../components/table/table-cells/common/date-cell"
import { TextCell } from "../../../../../components/table/table-cells/common/text-cell"
import { useDataTable } from "../../../../../hooks/use-data-table"

type AttributePossibleValuesSectionProps = {
  attribute: AttributeDTO
}

const columnHelper = createColumnHelper<AttributePossibleValueDTO>()

const PAGE_SIZE = 10

export const AttributePossibleValuesSection = ({
  attribute,
}: AttributePossibleValuesSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const possibleValues = attribute.possible_values ?? []

  const columns = useMemo(
    () => [
      columnHelper.accessor("value", {
        header: () => t("attributes.fields.value"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("rank", {
        header: () => t("attributes.fields.rank"),
        cell: ({ getValue }) => <TextCell text={String(getValue())} />,
      }),
      columnHelper.accessor("created_at", {
        header: () => t("fields.createdAt"),
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const possibleValue = row.original
          return (
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      icon: <PencilSquare />,
                      label: t("actions.edit"),
                      to: `edit-possible-value?possible_value_id=${possibleValue.id}`,
                    },
                  ],
                },
              ]}
            />
          )
        },
      }),
    ],
    [t, navigate]
  )

  const { table } = useDataTable({
    data: possibleValues,
    count: possibleValues.length,
    columns,
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
  })

  if (!possibleValues.length) {
    return null
  }

  return (
    <Container
      className="divide-y px-0 py-0"
      data-testid="attribute-possible-values-section-container"
    >
      <div
        className="px-6 py-4"
        data-testid="attribute-possible-values-section-header"
      >
        <Heading
          level="h2"
          data-testid="attribute-possible-values-section-heading"
        >
          {t("attributes.fields.possibleValues")}
        </Heading>
      </div>
      <_DataTable
        table={table}
        columns={columns}
        pageSize={PAGE_SIZE}
        count={possibleValues.length}
        data-testid="attribute-possible-values-section-table"
      />
    </Container>
  )
}
