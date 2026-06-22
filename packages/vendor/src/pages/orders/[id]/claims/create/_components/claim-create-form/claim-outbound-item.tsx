import { XCircle } from "@medusajs/icons"
import { Input, Text } from "@medusajs/ui"
import { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { Form } from "@components/common/form"
import { Thumbnail } from "@components/common/thumbnail"

import { CreateClaimSchemaType } from "./schema"

type ClaimOutboundItemProps = {
  index: number

  onRemove: () => void

  form: UseFormReturn<CreateClaimSchemaType>
}

/**
 * Vendor port of admin's `ClaimOutboundItem`. The replacement row stays
 * minimal — thumbnail, title/SKU, qty input, remove. Pricing for offers
 * is resolved server-side on confirm so we don't render a money cell
 * here (admin renders `previewItem.total` because the admin draft
 * already has totals attached; vendor only has the form-side snapshot).
 */
function ClaimOutboundItem({
  form,
  onRemove,
  index,
}: ClaimOutboundItemProps) {
  const { t } = useTranslation()

  const row = form.watch(`outbound_items.${index}`)
  const productTitle = row?.product_title ?? row?.variant_title ?? row?.offer_id

  return (
    <div
      className="bg-ui-bg-subtle shadow-elevation-card-rest my-2 rounded-xl"
      data-testid={`claim-outbound-item-${row?.offer_id ?? index}`}
    >
      <div className="flex flex-col items-center gap-x-2 gap-y-2 border-b p-3 text-sm md:flex-row">
        <div className="flex flex-1 items-center gap-x-3">
          <Thumbnail src={row?.thumbnail ?? undefined} />

          <div className="flex flex-col">
            <div>
              <Text className="txt-small" as="span" weight="plus">
                {productTitle}{" "}
              </Text>

              {row?.sku && <span>({row.sku})</span>}
            </div>
            {row?.variant_title && (
              <Text as="div" className="text-ui-fg-subtle txt-small">
                {row.variant_title}
              </Text>
            )}
          </div>
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
                        type="number"
                        onBlur={(e) => {
                          const val = e.target.value
                          const payload = val === "" ? null : Number(val)

                          field.onChange(payload)
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

export { ClaimOutboundItem }
