import { Plus, Trash } from "@medusajs/icons"
import { Button, Heading, IconButton, Input, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../components/common/form"
import { Combobox } from "../../../../components/inputs/combobox"
import { useInventoryItems } from "../../../../hooks/api/inventory"
import { findDuplicateInventoryIndexes } from "./schema"

export type InventoryItemsFieldArrayValues = {
  inventory_items: {
    inventory_item_id: string
    required_quantity: number | string
  }[]
}

export const InventoryItemsRepeater = () => {
  const { t } = useTranslation()
  const form = useFormContext<InventoryItemsFieldArrayValues>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "inventory_items",
  })

  const [search, setSearch] = useState("")
  const { inventory_items } = useInventoryItems({
    limit: 50,
    q: search,
    fields: "id,sku,title",
  })

  const watched = form.watch("inventory_items")
  const duplicates = findDuplicateInventoryIndexes(
    (watched ?? []) as Parameters<typeof findDuplicateInventoryIndexes>[0],
  )

  useEffect(() => {
    if (fields.length === 0) {
      append({ inventory_item_id: "", required_quantity: 1 })
    }
  }, [fields.length, append])

  const options = (inventory_items ?? []).map((item) => ({
    value: item.id,
    label: item.title
      ? `${item.title} (${item.sku ?? "—"})`
      : (item.sku ?? item.id),
  }))

  return (
    <div
      className="flex flex-col gap-y-3"
      data-testid="offer-create-inventory-items-repeater"
    >
      <div>
        <Heading level="h3">{t("offers.create.inventoryItems")}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {t("offers.create.inventoryItemsDescription")}
        </Text>
      </div>

      <div className="flex flex-col gap-y-3">
        {fields.map((field, index) => {
          const isDuplicate = duplicates.includes(index)
          return (
            <div
              key={field.id}
              className="bg-ui-bg-component shadow-elevation-card-rest rounded-lg p-3"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr]">
                <Form.Field
                  control={form.control}
                  name={`inventory_items.${index}.inventory_item_id`}
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
                  name={`inventory_items.${index}.required_quantity`}
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
              </div>

              {isDuplicate && (
                <Text size="small" className="text-ui-fg-error mt-2">
                  {t("offers.validation.duplicateInventoryItem")}
                </Text>
              )}

              {fields.length > 1 && (
                <div className="mt-2 flex justify-end">
                  <IconButton
                    size="small"
                    variant="transparent"
                    type="button"
                    onClick={() => remove(index)}
                  >
                    <Trash />
                  </IconButton>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div>
        <Button
          size="small"
          variant="transparent"
          type="button"
          onClick={() =>
            append({ inventory_item_id: "", required_quantity: 1 })
          }
        >
          <Plus />
          {t("offers.create.addInventoryItem")}
        </Button>
      </div>
    </div>
  )
}
