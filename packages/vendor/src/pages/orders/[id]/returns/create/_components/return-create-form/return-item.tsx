import { ChatBubble, DocumentText, XCircle, XMark } from "@medusajs/icons"
import {
  AdminOrderLineItem,
  AdminOrderPreview,
  HttpTypes,
} from "@medusajs/types"

type AdminOrderLinePreview = AdminOrderPreview["items"][number]
import { IconButton, Input, Text } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  Action,
  ActionMenu,
} from "@components/common/action-menu"
import { Form } from "@components/common/form"
import { Thumbnail } from "@components/common/thumbnail"
import { Combobox } from "@components/inputs/combobox"
import { MoneyAmountCell } from "@components/table/table-cells/common/money-amount-cell"
import { useReturnReasons } from "@hooks/api/return-reasons"
import {
  getOfferRestockPreview,
  type LineItemShape,
} from "@lib/inventory-preview"

import { ReturnCreateSchemaType } from "./schema"

type ReturnItemProps = {
  item: AdminOrderLineItem
  previewItem: AdminOrderLinePreview
  currencyCode: string
  index: number

  locationId?: string
  locationName?: string | null

  onRemove: () => void
  onUpdate: (payload: HttpTypes.AdminUpdateReturnItems) => void

  form: UseFormReturn<ReturnCreateSchemaType>
}

function ReturnItem({
  item,
  previewItem,
  currencyCode,
  form,
  onRemove,
  onUpdate,
  index,
  locationId,
  locationName,
}: ReturnItemProps) {
  const { t } = useTranslation()

  const { return_reasons: returnReasons = [] } = useReturnReasons({
    fields: "+label",
  })

  const formItem = form.watch(`items.${index}`)

  const showReturnReason = typeof formItem?.reason_id === "string"
  const showNote = typeof formItem?.note === "string"

  // Reuse the vendor offer-aware preview so sellers see exactly how their
  // stock will move when the receive step lands. Same calculation as
  // `mercur-confirm-return-receive` runs on the backend.
  const restockRows = locationId
    ? getOfferRestockPreview(
        item as unknown as LineItemShape,
        formItem?.quantity ?? 0
      )
    : []
  const offerSku =
    (item as unknown as LineItemShape).offer?.sku ?? item.variant_sku ?? null

  return (
    <div
      className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 rounded-xl"
      data-testid={`return-item-${item.id}`}
    >
      <div className="flex flex-col items-center gap-x-2 gap-y-2 border-b p-3 text-sm md:flex-row">
        <div className="flex flex-1 items-center gap-x-3">
          <Thumbnail src={item.thumbnail} />
          <div className="flex flex-col">
            <div>
              <Text className="txt-small" as="span" weight="plus">
                {item.title}{" "}
              </Text>
              {item.variant_sku && <span>({item.variant_sku})</span>}
            </div>
            <Text as="div" className="text-ui-fg-subtle txt-small">
              {item.product_title}
            </Text>
          </div>
        </div>

        <div className="flex flex-1 justify-between">
          <div className="flex flex-grow items-center gap-2">
            <Form.Field
              control={form.control}
              name={`items.${index}.quantity`}
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Input
                        className="bg-ui-bg-base txt-small w-[67px] rounded-lg"
                        min={1}
                        max={item.quantity}
                        type="number"
                        data-testid={`return-item-${item.id}-qty`}
                        {...field}
                        onChange={(e) => {
                          const val = e.target.value
                          const payload = val === "" ? null : Number(val)

                          field.onChange(payload)

                          if (payload) {
                            // Mirror admin: update on change. Could be moved
                            // to blur if we want to avoid one mutation per
                            // keystroke.
                            onUpdate({ quantity: payload })
                          }
                        }}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Text className="txt-small text-ui-fg-subtle">
              {t("fields.qty")}
            </Text>
          </div>

          <div className="text-ui-fg-subtle txt-small mr-2 flex flex-shrink-0">
            <MoneyAmountCell
              currencyCode={currencyCode}
              amount={previewItem.return_requested_total}
            />
          </div>

          <ActionMenu
            groups={[
              {
                actions: [
                  !showReturnReason && {
                    label: t("actions.addReason"),
                    onClick: () =>
                      form.setValue(`items.${index}.reason_id`, ""),
                    icon: <ChatBubble />,
                  },
                  !showNote && {
                    label: t("actions.addNote"),
                    onClick: () => form.setValue(`items.${index}.note`, ""),
                    icon: <DocumentText />,
                  },
                  {
                    label: t("actions.remove"),
                    onClick: onRemove,
                    icon: <XCircle />,
                  },
                ].filter(Boolean) as Action[],
              },
            ]}
          />
        </div>
      </div>

      {/* Offer-aware restock preview — vendor-only addition surfaced under
          the item once a location is chosen so the seller sees the impact
          on each linked inventory item before they confirm. */}
      {restockRows.length > 0 && (
        <div className="bg-ui-bg-subtle flex flex-col gap-y-1 rounded-md px-3 py-2">
          {restockRows.map((row) => (
            <Text
              key={row.inventoryItemId}
              size="xsmall"
              className="text-ui-fg-subtle"
              data-testid={`return-item-${item.id}-restock-${row.inventoryItemId}`}
            >
              {t("orders.returns.restockPreview", {
                quantity: formItem?.quantity ?? 0,
                offerSku: offerSku ?? "—",
                delta: row.delta,
                inventoryItem: row.inventoryItemLabel,
                location: locationName ?? "—",
              })}
            </Text>
          ))}
        </div>
      )}

      <>
        {/* REASON*/}
        {showReturnReason && (
          <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2">
            <div>
              <Form.Label>{t("orders.returns.reason")}</Form.Label>
              <Form.Hint className="!mt-1">
                {t("orders.returns.reasonHint")}
              </Form.Hint>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex-grow">
                <Form.Field
                  control={form.control}
                  name={`items.${index}.reason_id`}
                  render={({ field: { ref, value, onChange, ...field } }) => {
                    void ref
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Combobox
                            value={value ?? undefined}
                            onChange={(v) => {
                              onUpdate({ reason_id: v })
                              onChange(v)
                            }}
                            {...field}
                            options={returnReasons.map(
                              (reason: { id: string; label?: string; value?: string }) => ({
                                label: reason.label ?? reason.value ?? reason.id,
                                value: reason.id,
                              })
                            )}
                            data-testid={`return-item-${item.id}-reason`}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />
              </div>
              <IconButton
                type="button"
                className="flex-shrink"
                variant="transparent"
                onClick={() => {
                  onUpdate({ reason_id: null })
                  form.setValue(`items.${index}.reason_id`, null)
                }}
              >
                <XMark className="text-ui-fg-muted" />
              </IconButton>
            </div>
          </div>
        )}

        {/* NOTE*/}
        {showNote && (
          <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2">
            <div>
              <Form.Label>{t("orders.returns.note")}</Form.Label>
              <Form.Hint className="!mt-1">
                {t("orders.returns.noteHint")}
              </Form.Hint>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex-grow">
                <Form.Field
                  control={form.control}
                  name={`items.${index}.note`}
                  render={({ field: { ref, value, onChange, ...field } }) => {
                    void ref
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Input
                            value={value ?? ""}
                            onChange={onChange}
                            {...field}
                            onBlur={() =>
                              onUpdate({ internal_note: value ?? null })
                            }
                            className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                            data-testid={`return-item-${item.id}-note`}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />
              </div>
              <IconButton
                type="button"
                className="flex-shrink"
                variant="transparent"
                onClick={() => {
                  form.setValue(`items.${index}.note`, null)
                  onUpdate({ internal_note: null })
                }}
              >
                <XMark className="text-ui-fg-muted" />
              </IconButton>
            </div>
          </div>
        )}
      </>
    </div>
  )
}

export { ReturnItem }
