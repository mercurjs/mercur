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
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"

import { ProductAttributeDTO, ProductAttributeValueDTO, AttributeType } from "@mercurjs/types"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { NoRecords } from "../../../../../components/common/empty-table-content"
import { _DataTable } from "../../../../../components/table/data-table"
import { TextCell } from "../../../../../components/table/table-cells/common/text-cell"
import { useDataTable } from "../../../../../hooks/use-data-table"
import { useUpdateProductAttribute } from "../../../../../hooks/api/product-attributes"

type AttributePossibleValuesSectionProps = {
  attribute: ProductAttributeDTO
}

const PossibleValueActions = ({
  value,
  attribute,
}: {
  value: ProductAttributeValueDTO
  attribute: ProductAttributeDTO
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useUpdateProductAttribute(attribute.id)
  const [inUseOpen, setInUseOpen] = useState(false)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("attributes.deletePossibleValue.confirmation", {
        value: value.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) return

    const remainingValues = (attribute.values ?? [])
      .filter((pv) => pv.id !== value.id)
      .map((pv) => ({ id: pv.id, name: pv.name, rank: pv.rank }))

    try {
      await mutateAsync({ possible_values: remainingValues })
      toast.success(
        t("attributes.deletePossibleValue.successToast", {
          value: value.name,
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
                value: value.name,
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

const columnHelper = createColumnHelper<ProductAttributeValueDTO>()

const PAGE_SIZE = 10

export const AttributePossibleValuesSection = ({
  attribute,
}: AttributePossibleValuesSectionProps) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [searchParams, setSearchParams] = useSearchParams()

  if (attribute.type !== AttributeType.SINGLE_SELECT && attribute.type !== AttributeType.MULTI_SELECT) {
    return null
  }

  const allValues = useMemo(
    () => attribute.values ?? [],
    [attribute.values]
  )

  const filtered = useMemo(() => {
    if (!search) return allValues
    const q = search.toLowerCase()
    return allValues.filter((v) => v.name?.toLowerCase().includes(q))
  }, [allValues, search])

  const offsetParam = searchParams.get("offset")
  const parsedOffset = Number(offsetParam)
  const requestedOffset =
    Number.isFinite(parsedOffset) && parsedOffset >= 0
      ? Math.floor(parsedOffset / PAGE_SIZE) * PAGE_SIZE
      : 0
  const lastOffset =
    filtered.length > 0
      ? Math.floor((filtered.length - 1) / PAGE_SIZE) * PAGE_SIZE
      : 0
  const offset = Math.min(requestedOffset, lastOffset)
  const page = filtered.slice(offset, offset + PAGE_SIZE)

  useEffect(() => {
    const normalizedOffset = offset > 0 ? String(offset) : null

    if (offsetParam === normalizedOffset) {
      return
    }

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)

        if (normalizedOffset) {
          next.set("offset", normalizedOffset)
        } else {
          next.delete("offset")
        }

        return next
      },
      { replace: true }
    )
  }, [offset, offsetParam, setSearchParams])

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
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
    data: page,
    count: filtered.length,
    columns,
    getRowId: (row) => row.id,
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
            onChange={(e) => {
              setSearch(e.target.value)

              if (!searchParams.has("offset")) {
                return
              }

              setSearchParams(
                (current) => {
                  const next = new URLSearchParams(current)
                  next.delete("offset")
                  return next
                },
                { replace: true }
              )
            }}
            className="w-[200px]"
          />
          <Button variant="secondary" size="small" asChild>
            <Link to="edit-ranking">
              {t("attributes.possibleValues.editRanking")}
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
          title={t("attributes.possibleValues.noRecordsTitle")}
          message={t("attributes.possibleValues.noRecordsMessage")}
          action={{
            to: "create-possible-value",
            label: t("actions.create"),
          }}
        />
      )}
    </Container>
  )
}
