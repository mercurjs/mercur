import { ChatBubble, DocumentText, XCircle, XMark } from "@medusajs/icons"
import { AdminOrderLineItem, HttpTypes } from "@medusajs/types"
import { IconButton, Input, Text } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Action, ActionMenu } from "@components/common/action-menu"
import { Form } from "@components/common/form"
import { Thumbnail } from "@components/common/thumbnail"
import { Combobox } from "@components/inputs/combobox"
import { MoneyAmountCell } from "@components/table/table-cells/common/money-amount-cell"
import { useReturnReasons } from "@hooks/api/return-reasons"
import {
  getOfferRestockPreview,
  type LineItemShape,
} from "@lib/inventory-preview"

import { CreateExchangeSchemaType } from "./schema"

type ReturnReason = {
  id: string
  label?: string | null
  value?: string | null
}

// The admin's `AdminOrderLinePreview` is the change-preview shape that
// carries `return_requested_total` and `adjustments` (applied promotions).
// Mercur's `@medusajs/types@2.13.4` doesn't expose that as a named export
// so we describe the few fields we actually read locally.
type ExchangePreviewItem = {
  return_requested_total?: number
  adjustments?: Array<{ code?: string | null }>
}

type ExchangeInboundItemProps = {
  item: AdminOrderLineItem
  previewItem?: ExchangePreviewItem
  currencyCode: string
  index: number
  /**
   * Vendor-only: stock location name selected at the form level. When
   * present (and `quantity > 0`) a per-row restock preview is rendered
   * so the seller sees exactly where inventory will land before confirm.
   */
  locationName?: string | null

  onRemove: () => void
  onUpdate: (payload: HttpTypes.AdminUpdateReturnItems) => void

  form: UseFormReturn<CreateExchangeSchemaType>
}

/**
 * Vendor port of admin's `ExchangeInboundItem`. Renders one row of the
 * exchange's inbound items list: thumbnail + title, quantity input, refund
 * amount, and a row-level action menu (Add reason / Add note / Remove).
 *
 * The signature mirrors admin one-for-one: it expects a parent that drives
 * a React Hook Form against `CreateExchangeSchemaType` and supplies
 * `onUpdate` / `onRemove` callbacks bound to the matching draft action ID.
 *
 * Vendor-specific additions:
 *   - `locationName` prop drives an inline restock preview using the same
 *     `getOfferRestockPreview` math the backend runs at receive time.
 */
function ExchangeInboundItem({
  item,
  previewItem,
  currencyCode,
  form,
  onRemove,
  onUpdate,
  index,
  locationName,
}: ExchangeInboundItemProps) {
  const { t } = useTranslation()
  const { return_reasons = [] } = useReturnReasons({ fields: "+label" })
  const returnReasons = return_reasons as ReturnReason[]

  const formItem = form.watch(`inbound_items.${index}`)
  const showReturnReason = typeof formItem?.reason_id === "string"
  const showNote = typeof formItem?.note === "string"
  const quantity = formItem?.quantity ?? 0

  const appliedPromoCodes = (previewItem?.adjustments ?? [])
    .map((adjustment) => adjustment.code)
    .filter((code): code is string => Boolean(code))

  return (
    <div
      className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 rounded-xl"
      data-testid={`exchange-inbound-item-${item.id}`}
    >
      <div className="flex flex-col items-center gap-x-3 gap-y-2 p-3 text-sm md:flex-row">
        <div className="flex flex-1 items-center gap-x-3">
          <Thumbnail src={item.thumbnail} />

          <div className="flex flex-grow flex-col">
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
          {appliedPromoCodes.length > 0 && (
            <div
              className="flex flex-shrink"
              title={appliedPromoCodes.join(", ")}
            />
          )}
        </div>

        <div className="flex flex-1 justify-between">
          <div className="flex flex-grow items-center gap-2">
            <Form.Field
              control={form.control}
              name={`inbound_items.${index}.quantity`}
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Input
                        {...field}
                        className="bg-ui-bg-base txt-small w-[67px] rounded-lg"
                        min={1}
                        max={item.quantity}
                        type="number"
                        data-testid={`exchange-inbound-item-${item.id}-qty`}
                        onBlur={(e) => {
                          const val = e.target.value
                          const payload = val === "" ? null : Number(val)

                          field.onChange(payload)

                          if (payload) {
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
              amount={previewItem?.return_requested_total ?? 0}
            />
          </div>

          <ActionMenu
            groups={[
              {
                actions: [
                  !showReturnReason && {
                    label: t("actions.addReason"),
                    onClick: () =>
                      form.setValue(`inbound_items.${index}.reason_id`, ""),
                    icon: <ChatBubble />,
                  },
                  !showNote && {
                    label: t("actions.addNote"),
                    onClick: () =>
                      form.setValue(`inbound_items.${index}.note`, ""),
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

      {locationName && quantity > 0 && (
        <ExchangeRestockPreview
          item={item as unknown as LineItemShape}
          quantity={quantity}
          locationName={locationName}
        />
      )}

      {/* REASON */}
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
                name={`inbound_items.${index}.reason_id`}
                render={({ field: { value, onChange, ref: _ref, ...field } }) => {
                  return (
                    <Form.Item>
                      <Form.Control>
                        <Combobox
                          className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                          value={value ?? undefined}
                          onChange={(v) => {
                            onUpdate({ reason_id: v ?? null })
                            onChange(v)
                          }}
                          {...field}
                          options={returnReasons.map((reason) => ({
                            label: reason.label ?? reason.value ?? reason.id,
                            value: reason.id,
                          }))}
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
                form.setValue(`inbound_items.${index}.reason_id`, null)
                onUpdate({ reason_id: null })
              }}
            >
              <XMark className="text-ui-fg-muted" />
            </IconButton>
          </div>
        </div>
      )}

      {/* NOTE */}
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
                name={`inbound_items.${index}.note`}
                render={({ field: { ref: _ref, value, ...field } }) => {
                  return (
                    <Form.Item>
                      <Form.Control>
                        <Input
                          {...field}
                          value={value ?? ""}
                          data-testid={`exchange-inbound-item-${item.id}-note`}
                          onBlur={(e) => {
                            const next = e.target.value
                            field.onChange(next)
                            onUpdate({ internal_note: next || null })
                          }}
                          className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
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
                form.setValue(`inbound_items.${index}.note`, null)
                onUpdate({ internal_note: null })
              }}
            >
              <XMark className="text-ui-fg-muted" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Vendor-only: inline inventory hint shown when the seller has chosen
 * both a return location and a quantity > 0. Uses the same offer ↔
 * inventory_item math the receive flow runs server-side so the preview
 * matches what will actually happen on confirm.
 */
const ExchangeRestockPreview = ({
  item,
  quantity,
  locationName,
}: {
  item: LineItemShape
  quantity: number
  locationName: string | null
}) => {
  const { t } = useTranslation()
  const preview = getOfferRestockPreview(item, quantity)
  if (!preview.length) {
    return null
  }
  const offerSku = item.offer?.sku ?? item.variant_sku ?? null
  return (
    <div className="bg-ui-bg-subtle flex flex-col gap-y-1 rounded-md px-3 py-2">
      {preview.map((row) => (
        <Text
          key={row.inventoryItemId}
          size="xsmall"
          className="text-ui-fg-subtle"
          data-testid={`exchange-inbound-item-${item.id}-restock-${row.inventoryItemId}`}
        >
          {t("orders.returns.restockPreview", {
            quantity,
            offerSku: offerSku ?? "—",
            delta: row.delta,
            inventoryItem: row.inventoryItemLabel,
            location: locationName ?? "—",
          })}
        </Text>
      ))}
    </div>
  )
}

export { ExchangeInboundItem }
