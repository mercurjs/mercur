import { XCircle } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Input, Text } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { Form } from "@components/common/form"
import { Thumbnail } from "@components/common/thumbnail"
import { MoneyAmountCell } from "@components/table/table-cells/common/money-amount-cell"

import { CreateExchangeSchemaType } from "./schema"

// `previewItem` mirrors the shape admin reads off `AdminOrderLineItem` —
// only the fields actually rendered here. Vendor doesn't ship a named
// `AdminOrderLinePreview` type in `@medusajs/types@2.13.4` so we describe
// the surface inline rather than reaching for `any`.
type ExchangeOutboundPreviewItem = {
  id: string
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  variant_sku?: string | null
  subtitle?: string | null
  thumbnail?: string | null
  total?: number | null
  adjustments?: Array<{ code?: string | null }>
}

type ExchangeOutboundItemProps = {
  previewItem: ExchangeOutboundPreviewItem
  currencyCode: string
  index: number

  onRemove: () => void
  // TODO: create a payload type for outbound updates
  onUpdate: (payload: HttpTypes.AdminUpdateReturnItems) => void

  form: UseFormReturn<CreateExchangeSchemaType>
}

/**
 * Vendor port of admin's `ExchangeOutboundItem`. One row of the outbound
 * (replacement) items list — thumbnail + title, qty input, total, remove
 * action. Visual layout matches admin exactly.
 */
function ExchangeOutboundItem({
  previewItem,
  currencyCode,
  form,
  onRemove,
  onUpdate,
  index,
}: ExchangeOutboundItemProps) {
  const { t } = useTranslation()

  const appliedPromoCodes = (previewItem.adjustments ?? [])
    .map((adjustment) => adjustment.code)
    .filter((code): code is string => Boolean(code))

  return (
    <div
      className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 rounded-xl"
      data-testid={`exchange-outbound-item-${previewItem.id}`}
    >
      <div className="flex flex-col items-center gap-x-3 gap-y-2 p-3 text-sm md:flex-row">
        <div className="flex flex-1 items-center gap-x-3">
          <Thumbnail src={previewItem.thumbnail ?? undefined} />

          <div className="flex flex-grow flex-col">
            <div>
              <Text className="txt-small" as="span" weight="plus">
                {previewItem.title}{" "}
              </Text>

              {previewItem.variant_sku && (
                <span>({previewItem.variant_sku})</span>
              )}
            </div>
            <Text as="div" className="text-ui-fg-subtle txt-small">
              {previewItem.subtitle ?? previewItem.variant_title ?? ""}
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
              name={`outbound_items.${index}.quantity`}
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Control>
                      <Input
                        {...field}
                        className="bg-ui-bg-base txt-small w-[67px] rounded-lg"
                        min={1}
                        // TODO: add max available inventory quantity if present
                        type="number"
                        data-testid={`exchange-outbound-item-${previewItem.id}-qty`}
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
              amount={previewItem.total ?? 0}
            />
          </div>

          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.remove"),
                    onClick: onRemove,
                    icon: <XCircle />,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

export { ExchangeOutboundItem }
