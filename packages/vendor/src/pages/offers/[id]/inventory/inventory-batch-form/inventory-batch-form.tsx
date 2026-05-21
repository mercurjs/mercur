import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash, XMark } from "@medusajs/icons"
import {
  Button,
  IconButton,
  Input,
  Text,
  toast,
} from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../components/common/form"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useInventoryItems } from "../../../../../hooks/api/inventory"
import { useBatchOfferInventoryItems } from "../../../../../hooks/api/offers"
import { OfferDetail } from "../../../common/types"
import {
  BatchInventoryFormSchema,
  BatchInventoryFormValues,
} from "./schema"

type Props = { offer: OfferDetail }

const buildDefaults = (offer: OfferDetail): BatchInventoryFormValues => ({
  rows: (offer.inventory_item_link ?? []).map((link) => ({
    kind: "existing" as const,
    link_id: link.id,
    inventory_item_id: link.inventory_item_id,
    required_quantity: link.required_quantity ?? 1,
    original_required_quantity: link.required_quantity ?? 1,
    marked_for_delete: false,
    inventory_item_title: link.inventory_item?.title ?? null,
    inventory_item_sku: link.inventory_item?.sku ?? null,
  })),
})

export const InventoryBatchForm = ({ offer }: Props) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const [search, setSearch] = useState("")
  const { inventory_items } = useInventoryItems({
    limit: 50,
    q: search,
    fields: "id,sku,title",
  })

  const form = useForm<BatchInventoryFormValues>({
    defaultValues: buildDefaults(offer),
    resolver: zodResolver(BatchInventoryFormSchema),
  })

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "rows",
  })

  const watched = form.watch("rows")

  const existingIds = useMemo(
    () =>
      new Set(
        (watched ?? [])
          .filter((r) => r.kind === "existing" && !r.marked_for_delete)
          .map((r) => r.inventory_item_id),
      ),
    [watched],
  )

  const options = (inventory_items ?? [])
    .filter((item) => !existingIds.has(item.id))
    .map((item) => ({
      value: item.id,
      label: item.title
        ? `${item.title} (${item.sku ?? "—"})`
        : (item.sku ?? item.id),
    }))

  const { mutateAsync, isPending } = useBatchOfferInventoryItems(offer.id)

  const hasDuplicate = useMemo(() => {
    const ids = new Set<string>()
    for (const row of watched ?? []) {
      if (row.kind === "existing" && row.marked_for_delete) continue
      if (!row.inventory_item_id) continue
      if (ids.has(row.inventory_item_id)) return true
      ids.add(row.inventory_item_id)
    }
    return false
  }, [watched])

  const handleSubmit = form.handleSubmit(async (values) => {
    if (hasDuplicate) {
      toast.error(t("offers.validation.duplicateBatchEntry"))
      return
    }

    const create: { inventory_item_id: string; required_quantity: number }[] = []
    const updateBucket: {
      inventory_item_id: string
      required_quantity: number
    }[] = []
    const deleteBucket: string[] = []

    for (const row of values.rows) {
      if (row.kind === "new") {
        create.push({
          inventory_item_id: row.inventory_item_id,
          required_quantity: Number(row.required_quantity) || 1,
        })
        continue
      }
      if (row.marked_for_delete) {
        deleteBucket.push(row.inventory_item_id)
        continue
      }
      if (
        Number(row.required_quantity) !==
        Number(row.original_required_quantity)
      ) {
        updateBucket.push({
          inventory_item_id: row.inventory_item_id,
          required_quantity: Number(row.required_quantity) || 1,
        })
      }
    }

    await mutateAsync(
      {
        ...(create.length ? { create } : {}),
        ...(updateBucket.length ? { update: updateBucket } : {}),
        ...(deleteBucket.length ? { delete: deleteBucket } : {}),
      },
      {
        onSuccess: () => {
          toast.success(t("offers.inventory.successToast"))
          handleSuccess()
        },
        onError: (e) => toast.error(e.message),
      },
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="offer-inventory-batch-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
          {fields.map((field, index) => {
            const isExisting = field.kind === "existing"
            const isMarkedDelete =
              isExisting && (field as ExistingFieldRow).marked_for_delete
            return (
              <div
                key={field.id}
                className={
                  "bg-ui-bg-component shadow-elevation-card-rest rounded-lg p-3" +
                  (isMarkedDelete ? " opacity-60" : "")
                }
              >
                {isExisting ? (
                  <div className="flex items-center justify-between gap-x-3">
                    <div className="flex flex-col overflow-hidden">
                      <Text size="small" weight="plus" className="truncate">
                        {(field as ExistingFieldRow).inventory_item_title ??
                          (field as ExistingFieldRow).inventory_item_sku ??
                          (field as ExistingFieldRow).inventory_item_id}
                      </Text>
                      {(field as ExistingFieldRow).inventory_item_sku && (
                        <Text
                          size="xsmall"
                          className="text-ui-fg-subtle font-mono"
                        >
                          {(field as ExistingFieldRow).inventory_item_sku}
                        </Text>
                      )}
                    </div>
                    <div className="flex items-end gap-x-2">
                      <Form.Field
                        control={form.control}
                        name={`rows.${index}.required_quantity`}
                        render={({ field: f }) => (
                          <Form.Item>
                            <Form.Label>
                              {t("offers.fields.requiredQuantity")}
                            </Form.Label>
                            <Form.Control>
                              <Input
                                type="number"
                                min="1"
                                disabled={isMarkedDelete}
                                {...f}
                                value={f.value ?? 1}
                              />
                            </Form.Control>
                            <Form.ErrorMessage />
                          </Form.Item>
                        )}
                      />
                      <IconButton
                        size="small"
                        variant="transparent"
                        type="button"
                        onClick={() =>
                          update(index, {
                            ...(field as ExistingFieldRow),
                            marked_for_delete: !isMarkedDelete,
                          })
                        }
                      >
                        {isMarkedDelete ? <XMark /> : <Trash />}
                      </IconButton>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_auto]">
                    <Form.Field
                      control={form.control}
                      name={`rows.${index}.inventory_item_id`}
                      render={({ field: f }) => (
                        <Form.Item>
                          <Form.Label>{t("inventory.domain")}</Form.Label>
                          <Form.Control>
                            <Combobox
                              value={f.value ?? ""}
                              onChange={(v) => f.onChange(v ?? "")}
                              searchValue={search}
                              onSearchValueChange={setSearch}
                              options={options}
                              hideCreateOption
                              allowClear
                            />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />
                    <Form.Field
                      control={form.control}
                      name={`rows.${index}.required_quantity`}
                      render={({ field: f }) => (
                        <Form.Item>
                          <Form.Label>
                            {t("offers.fields.requiredQuantity")}
                          </Form.Label>
                          <Form.Control>
                            <Input
                              type="number"
                              min="1"
                              {...f}
                              value={f.value ?? 1}
                            />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />
                    <div className="flex items-end">
                      <IconButton
                        size="small"
                        variant="transparent"
                        type="button"
                        onClick={() => remove(index)}
                      >
                        <Trash />
                      </IconButton>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <div>
            <Button
              size="small"
              variant="transparent"
              type="button"
              onClick={() =>
                append({
                  kind: "new",
                  inventory_item_id: "",
                  required_quantity: 1,
                })
              }
            >
              <Plus />
              {t("offers.create.addInventoryItem")}
            </Button>
          </div>

          {hasDuplicate && (
            <Text size="small" className="text-ui-fg-error">
              {t("offers.validation.duplicateBatchEntry")}
            </Text>
          )}
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              type="submit"
              size="small"
              isLoading={isPending}
              disabled={hasDuplicate}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

type ExistingFieldRow = Extract<
  BatchInventoryFormValues["rows"][number],
  { kind: "existing" }
>
