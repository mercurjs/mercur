import { PencilSquare, Trash } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Prompt,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { createColumnHelper } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { NoRecords } from "../../../../../components/common/empty-table-content"
import { _DataTable } from "../../../../../components/table/data-table"
import { TextCell } from "../../../../../components/table/table-cells/common/text-cell"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useUpdateAttribute } from "../../../../../hooks/api/attributes"

type AttributePossibleValuesSectionProps = {
  attribute: Record<string, any>
}

const PossibleValueActions = ({
  value,
  attribute,
}: {
  value: Record<string, any>
  attribute: Record<string, any>
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useUpdateAttribute(attribute.id)
  const [inUseOpen, setInUseOpen] = useState(false)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("attributes.deletePossibleValue.confirmation", {
        value: value.value,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) return

    const remainingValues = (attribute.possible_values ?? [])
      .filter((pv: any) => pv.id !== value.id)
      .map((pv: any) => ({ id: pv.id, value: pv.value, rank: pv.rank }))

    try {
      await mutateAsync({ possible_values: remainingValues })
      toast.success(
        t("attributes.deletePossibleValue.successToast", {
          value: value.value,
        })
      )
    } catch (err: any) {
      const isInUse = err.message?.includes("can't be deleted")

      if (isInUse) {
        setInUseOpen(true)
      } else {
        toast.error(err.message)
      }
    }
  }

  return (
    <>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                icon: <PencilSquare />,
                label: t("actions.edit"),
                to: `edit-possible-value?possible_value_id=${value.id}`,
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
      <Prompt open={inUseOpen} variant="confirmation">
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>
              {t("attributes.deletePossibleValue.title")}
            </Prompt.Title>
            <Prompt.Description>
              {t("attributes.deletePossibleValue.inUseMessage", {
                value: value.value,
              })}
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Action onClick={() => setInUseOpen(false)}>
              {t("attributes.delete.gotIt")}
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </>
  )
}

const columnHelper = createColumnHelper<any>()

const PAGE_SIZE = 10

export const AttributePossibleValuesSection = ({
  attribute,
}: AttributePossibleValuesSectionProps) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")

  const allValues = attribute.possible_values ?? []

  const filtered = useMemo(() => {
    if (!search) return allValues
    const q = search.toLowerCase()
    return allValues.filter((v: any) => v.value?.toLowerCase().includes(q))
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [search, allValues])

  const columns = useMemo(
    () => [
      columnHelper.accessor("value", {
        header: () => t("fields.name"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("rank", {
        header: () => t("attributes.fields.rank"),
        cell: ({ getValue }) => <TextCell text={String(getValue())} />,
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => (
          <PossibleValueActions value={row.original} attribute={attribute} />
        ),
      }),
    ],
    [t, attribute]
  )

  const { table } = useDataTable({
    data: filtered,
    count: filtered.length,
    columns,
    getRowId: (row: any) => row.id,
    pageSize: PAGE_SIZE,
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("attributes.fields.possibleValues")}</Heading>
        <div className="flex items-center gap-x-2">
          <Input
            size="small"
            type="search"
            placeholder={t("general.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[200px]"
          />
          <Button variant="secondary" size="small" asChild>
            <Link to="edit-ranking">
              {t("attributes.possibleValues.editRanking", "Edit ranking")}
            </Link>
          </Button>
          <Button variant="secondary" size="small" asChild>
            <Link to="create-possible-value">
              {t("actions.create")}
            </Link>
          </Button>
        </div>
      </div>
      {allValues.length > 0 ? (
        <_DataTable
          table={table}
          columns={columns}
          pageSize={PAGE_SIZE}
          count={filtered.length}
          pagination
        />
      ) : (
        <NoRecords
          className="border-t"
          title={t("attributes.possibleValues.noRecordsTitle", "No created values")}
          message={t("attributes.possibleValues.noRecordsMessage", "Create attribute to organize your products")}
          action={{
            to: "create-possible-value",
            label: t("actions.create"),
          }}
        />
      )}
    </Container>
  )
}
