import { zodResolver } from "@hookform/resolvers/zod"
import type { HttpTypes } from "@medusajs/types"
import { Button, Checkbox, Hint, Tooltip, toast } from "@medusajs/ui"
import { keepPreviousData } from "@tanstack/react-query"
import {
  type OnChangeFn,
  type RowSelectionState,
  createColumnHelper,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { SellerDTO } from "@mercurjs/types"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { _DataTable } from "../../../../../components/table/data-table"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useBatchRegionSellers } from "../../../../../hooks/api/regions"
import { useSellers } from "../../../../../hooks/api/sellers"
import { useSellersTableColumns } from "../../../../../hooks/table/columns/use-seller-table-columns"
import { useSellersTableQuery } from "../../../../../hooks/table/query"
import { useDataTable } from "../../../../../hooks/use-data-table"

type AddSellersFormProps = {
  region: HttpTypes.AdminRegion
}

const AddSellersSchema = zod.object({
  seller_ids: zod.array(zod.string()).min(1),
})

const PAGE_SIZE = 50
const PREFIX = "as"

const isAssigned = (seller: SellerDTO, regionId: string) =>
  (seller.regions ?? []).some((r) => r.id === regionId)

export const AddSellersForm = ({ region }: AddSellersFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof AddSellersSchema>>({
    defaultValues: {
      seller_ids: [],
    },
    resolver: zodResolver(AddSellersSchema),
  })

  const { setValue } = form

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const updater: OnChangeFn<RowSelectionState> = (fn) => {
    const state = typeof fn === "function" ? fn(rowSelection) : fn

    setValue("seller_ids", Object.keys(state), {
      shouldDirty: true,
      shouldTouch: true,
    })

    setRowSelection(state)
  }

  const { searchParams, raw } = useSellersTableQuery({
    pageSize: PAGE_SIZE,
    prefix: PREFIX,
  })

  const { sellers, count, isPending, isError, error } = useSellers(
    { ...searchParams, fields: "+regions.id" },
    { placeholderData: keepPreviousData }
  )

  const columns = useColumns()

  const { table } = useDataTable({
    data: sellers ?? [],
    columns,
    count: count ?? 0,
    enablePagination: true,
    enableRowSelection: (row) => !isAssigned(row.original, region.id),
    getRowId: (row) => row.id,
    pageSize: PAGE_SIZE,
    rowSelection: {
      state: rowSelection,
      updater,
    },
    prefix: PREFIX,
    meta: {
      regionId: region.id,
    },
  })

  const { mutateAsync, isPending: isMutating } = useBatchRegionSellers(
    region.id
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      { add: values.seller_ids },
      {
        onSuccess: () => {
          toast.success(t("regions.sellers.toast.added"))
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  if (isError) {
    throw error
  }

  return (
    <RouteFocusModal.Form form={form} data-testid="region-add-sellers-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header data-testid="region-add-sellers-form-header">
          <div className="flex items-center justify-end gap-x-2">
            {form.formState.errors.seller_ids && (
              <Hint variant="error" data-testid="region-add-sellers-form-error">
                {form.formState.errors.seller_ids.message}
              </Hint>
            )}
          </div>
        </RouteFocusModal.Header>
        <RouteFocusModal.Body
          className="overflow-hidden"
          data-testid="region-add-sellers-form-body"
        >
          <_DataTable
            table={table}
            columns={columns}
            pageSize={PAGE_SIZE}
            count={count ?? 0}
            isLoading={isPending}
            search="autofocus"
            pagination
            layout="fill"
            queryObject={raw}
            prefix={PREFIX}
            noRecords={{
              message: t("regions.sellers.noSellersToAdd"),
            }}
            data-testid="region-add-sellers-form-table"
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="region-add-sellers-form-footer">
          <RouteFocusModal.Close asChild>
            <Button
              size="small"
              variant="secondary"
              data-testid="region-add-sellers-form-cancel-button"
            >
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            size="small"
            isLoading={isMutating}
            type="submit"
            data-testid="region-add-sellers-form-add-button"
          >
            {t("actions.add")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

const columnHelper = createColumnHelper<SellerDTO>()

const useColumns = () => {
  const { t } = useTranslation()
  const base = useSellersTableColumns()

  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : table.getIsAllPageRowsSelected()
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            data-testid="region-add-sellers-form-select-all-checkbox"
          />
        ),
        cell: ({ row, table }) => {
          const { regionId } = table.options.meta as { regionId: string }
          const assigned = isAssigned(row.original, regionId)

          const checkbox = (
            <Checkbox
              checked={row.getIsSelected() || assigned}
              disabled={assigned}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation()
              }}
              data-testid={`region-add-sellers-form-select-checkbox-${row.original.id}`}
            />
          )

          if (assigned) {
            return (
              <Tooltip
                content={t("regions.sellers.alreadyAssigned")}
                side="right"
              >
                {checkbox}
              </Tooltip>
            )
          }

          return checkbox
        },
      }),
      ...base,
    ],
    [t, base]
  )
}
