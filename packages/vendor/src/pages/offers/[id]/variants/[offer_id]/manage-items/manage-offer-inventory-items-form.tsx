import { zodResolver } from "@hookform/resolvers/zod"
import { XMarkMini } from "@medusajs/icons"
import { Button, Heading, IconButton, Input, Label, Text, toast } from "@medusajs/ui"
import { useMemo } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../../components/common/form"
import { Combobox } from "../../../../../../components/inputs/combobox"
import { RouteFocusModal, useRouteModal } from "../../../../../../components/modals"
import { KeyboundForm } from "../../../../../../components/utilities/keybound-form"
import { useComboboxData } from "../../../../../../hooks/use-combobox-data"
import { useBatchOfferInventoryItems } from "../../../../../../hooks/api/offers"
import { sdk } from "../../../../../../lib/client"
import { castNumber } from "../../../../../../lib/cast-number"
import { OfferDetail } from "../../../../common/types"

type Values = {
  inventory: Array<{
    inventory_item_id: string
    required_quantity: number | string
  }>
}

export const ManageOfferInventoryItemsForm = ({
  offer,
}: {
  offer: OfferDetail
}) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const links = (offer.inventory_item_link ?? []).filter(
    (link) => link.inventory_item?.id,
  )

  const schema = useMemo(
    () =>
      z.object({
        inventory: z.array(
          z.object({
            inventory_item_id: z
              .string()
              .min(1, t("offers.inventory.validation.itemId")),
            required_quantity: z
              .union([z.number(), z.string()])
              .superRefine((value, ctx) => {
                const quantity =
                  value === "" || value === null || value === undefined
                    ? 0
                    : castNumber(value)
                if (!quantity || quantity < 1) {
                  ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: t("offers.inventory.validation.quantity"),
                  })
                }
              }),
          }),
        ),
      }),
    [t],
  )

  const form = useForm<Values>({
    defaultValues: {
      inventory: links.map((link) => ({
        inventory_item_id: link.inventory_item!.id,
        required_quantity: link.required_quantity ?? 1,
      })),
    },
    resolver: zodResolver(schema),
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "inventory",
  })

  const rows = useWatch({ control: form.control, name: "inventory" })
  const hasKit = fields.length > 1

  const items = useComboboxData({
    queryKey: ["offer_inventory_items"],
    queryFn: (params) => sdk.vendor.inventoryItems.query({ ...params }),
    getOptions: (data) =>
      (data.inventory_items ?? []).map((item) => ({
        label: item.sku
          ? `${item.title ?? item.sku} (${item.sku})`
          : (item.title ?? item.id),
        value: item.id,
      })),
  })

  const isItemOptionDisabled = (value: string, currentIndex: number) =>
    (rows ?? []).some(
      (row, index) =>
        index !== currentIndex && row?.inventory_item_id === value,
    )

  const { mutateAsync, isPending } = useBatchOfferInventoryItems(offer.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const original = new Map(
      links.map((link) => [
        link.inventory_item!.id,
        link.required_quantity ?? 1,
      ]),
    )
    const kept = new Set<string>()

    const create: Array<{
      inventory_item_id: string
      required_quantity: number
    }> = []
    const update: Array<{
      inventory_item_id: string
      required_quantity: number
    }> = []

    for (const row of values.inventory) {
      if (!row.inventory_item_id) {
        continue
      }
      const quantity = castNumber(row.required_quantity)
      const prior = original.get(row.inventory_item_id)
      kept.add(row.inventory_item_id)

      if (prior === undefined) {
        create.push({
          inventory_item_id: row.inventory_item_id,
          required_quantity: quantity,
        })
      } else if (prior !== quantity) {
        update.push({
          inventory_item_id: row.inventory_item_id,
          required_quantity: quantity,
        })
      }
    }

    const del = [...original.keys()].filter((id) => !kept.has(id))

    await mutateAsync(
      { create, update, delete: del },
      {
        onSuccess: () => {
          toast.success(t("offers.inventory.itemsManageSuccessToast"))
          handleSuccess()
        },
        onError: (error) => toast.error(error.message),
      },
    )
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col"
        data-testid="offer-manage-inventory-items-form"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-1 flex-col items-center overflow-auto">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-6 py-16">
            <Heading>
              {hasKit
                ? t("offers.inventory.kitHeading")
                : t("offers.inventory.itemsHeading")}
            </Heading>

            <div className="flex flex-col gap-y-4">
              <div className="flex items-start justify-between gap-x-4">
                <div className="flex flex-col">
                  <Text size="small" weight="plus">
                    {offer.product_variant?.title ?? offer.sku ?? "-"}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("offers.inventory.defineHint")}
                  </Text>
                </div>
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  onClick={() =>
                    append({ inventory_item_id: "", required_quantity: "" })
                  }
                  data-testid="offer-inventory-add-item"
                >
                  {t("actions.add")}
                </Button>
              </div>

              <ul className="flex flex-col gap-y-3">
                {fields.map((field, index) => (
                  <li
                    key={field.id}
                    className="bg-ui-bg-component shadow-elevation-card-rest grid grid-cols-[1fr_28px] items-center gap-1.5 rounded-xl p-1.5"
                  >
                    <div className="grid grid-cols-[min-content_1fr] items-center gap-x-3 gap-y-1.5 px-2 py-1">
                      <Label
                        size="xsmall"
                        weight="plus"
                        className="text-ui-fg-subtle"
                        htmlFor={`inventory.${index}.inventory_item_id`}
                      >
                        {t("fields.item")}
                      </Label>
                      <Form.Field
                        control={form.control}
                        name={`inventory.${index}.inventory_item_id`}
                        render={({ field: { ref: _ref, ...rest } }) => (
                          <Form.Item>
                            <Form.Control>
                              <Combobox
                                {...rest}
                                options={items.options.map((option) => ({
                                  ...option,
                                  disabled: isItemOptionDisabled(
                                    option.value,
                                    index,
                                  ),
                                }))}
                                searchValue={items.searchValue}
                                onSearchValueChange={items.onSearchValueChange}
                                fetchNextPage={items.fetchNextPage}
                                placeholder={t(
                                  "offers.inventory.itemPlaceholder",
                                )}
                              />
                            </Form.Control>
                            <Form.ErrorMessage />
                          </Form.Item>
                        )}
                      />
                      <Label
                        size="xsmall"
                        weight="plus"
                        className="text-ui-fg-subtle"
                        htmlFor={`inventory.${index}.required_quantity`}
                      >
                        {t("fields.quantity")}
                      </Label>
                      <Form.Field
                        control={form.control}
                        name={`inventory.${index}.required_quantity`}
                        render={({ field: { onChange, ...rest } }) => (
                          <Form.Item>
                            <Form.Control>
                              <Input
                                type="number"
                                min={1}
                                {...rest}
                                onChange={(event) => {
                                  const value = event.target.value
                                  onChange(value === "" ? "" : Number(value))
                                }}
                                placeholder={t(
                                  "offers.inventory.quantityPlaceholder",
                                )}
                              />
                            </Form.Control>
                            <Form.ErrorMessage />
                          </Form.Item>
                        )}
                      />
                    </div>
                    <IconButton
                      type="button"
                      size="small"
                      variant="transparent"
                      onClick={() => remove(index)}
                      data-testid={`offer-inventory-remove-item-${index}`}
                    >
                      <XMarkMini />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" type="button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
