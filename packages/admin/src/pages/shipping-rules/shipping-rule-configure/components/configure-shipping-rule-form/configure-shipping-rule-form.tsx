import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import {
  Button,
  CurrencyInput,
  Input,
  Select,
  Text,
  toast,
} from "@medusajs/ui"
import type {
  MarketplaceShippingMethodDTO,
  ShippingRuleDTO,
  ShippingRulePriceInput,
  ShippingZoneDTO,
} from "@mercurjs/types"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useBatchShippingRules } from "../../../../../hooks/api/shipping-rules"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"
import { getNativeSymbol } from "../../../../../lib/money-amount-helpers"
import { getShippingRulesPath } from "../../../common/utils"

const REQUIREMENTS = ["mandatory", "optional", "not_supported"] as const
const PRICE_TYPES = ["flat", "calculated"] as const

const optionalDays = z
  .string()
  .refine((value) => value === "" || /^\d+$/.test(value))

const ConfigureShippingRuleBaseSchema = z.object({
  requirement: z.enum(REQUIREMENTS),
  price_type: z.enum(PRICE_TYPES),
  prices: z.record(z.string(), z.string().optional()),
  seller_can_edit_price: z.boolean(),
  transit_min_days: optionalDays,
  transit_max_days: optionalDays,
  seller_can_edit_transit: z.boolean(),
})

const buildSchema = (transitRangeMessage: string) =>
  ConfigureShippingRuleBaseSchema.refine(
    (values) =>
      values.transit_min_days === "" ||
      values.transit_max_days === "" ||
      Number(values.transit_max_days) >= Number(values.transit_min_days),
    { path: ["transit_max_days"], message: transitRangeMessage }
  )

type ConfigureShippingRuleValues = z.infer<
  typeof ConfigureShippingRuleBaseSchema
>

type ConfigureShippingRuleFormProps = {
  zone: ShippingZoneDTO
  method: MarketplaceShippingMethodDTO
  profile: HttpTypes.AdminShippingProfile
  rule?: ShippingRuleDTO
  currencyCodes: string[]
}

const toDays = (value: string) => (value === "" ? null : Number(value))

const fromDays = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value)

export const ConfigureShippingRuleForm = ({
  zone,
  method,
  profile,
  rule,
  currencyCodes,
}: ConfigureShippingRuleFormProps) => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const { handleSuccess } = useRouteModal()

  const form = useForm<ConfigureShippingRuleValues>({
    defaultValues: {
      requirement: rule?.requirement ?? "optional",
      price_type: rule?.price_type ?? "flat",
      prices: Object.fromEntries(
        currencyCodes.map((code) => {
          const price = rule?.prices.find((p) => p.currency_code === code)
          return [code, price ? String(price.amount) : ""]
        })
      ),
      seller_can_edit_price: rule?.seller_can_edit_price ?? true,
      transit_min_days: fromDays(rule?.transit_min_days),
      transit_max_days: fromDays(rule?.transit_max_days),
      seller_can_edit_transit: rule?.seller_can_edit_transit ?? true,
    },
    resolver: zodResolver(
      buildSchema(t("shippingRules.validation.transitRange"))
    ),
  })

  const priceType = useWatch({ control: form.control, name: "price_type" })

  const { mutateAsync, isPending } = useBatchShippingRules()

  const handleSubmit = form.handleSubmit(async (values) => {
    const regionPrices: ShippingRulePriceInput[] = (rule?.prices ?? [])
      .filter((price) => !!price.region_id)
      .map((price) => ({ region_id: price.region_id!, amount: price.amount }))

    const currencyPrices: ShippingRulePriceInput[] = Object.entries(
      values.prices
    )
      .filter(([, amount]) => amount !== undefined && amount !== "")
      .map(([currency_code, amount]) => ({
        currency_code,
        amount: Number(amount),
      }))

    const settings = {
      requirement: values.requirement,
      price_type: values.price_type,
      prices: [...currencyPrices, ...regionPrices],
      seller_can_edit_price: values.seller_can_edit_price,
      transit_min_days: toDays(values.transit_min_days),
      transit_max_days: toDays(values.transit_max_days),
      seller_can_edit_transit: values.seller_can_edit_transit,
    }

    await mutateAsync(
      rule
        ? { update: [{ id: rule.id, ...settings }] }
        : {
            create: [
              {
                shipping_zone_id: zone.id,
                shipping_method_id: method.id,
                shipping_profile_id: profile.id,
                ...settings,
              },
            ],
          },
      {
        onSuccess: () => {
          toast.success(t("shippingRules.edit.successToast"))
          handleSuccess(getShippingRulesPath(zone.id))
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="requirement"
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label tooltip={t("shippingRules.fields.requirementHint")}>
                    {t("shippingRules.fields.requirement")}
                  </Form.Label>
                  <Form.Control>
                    <Select dir={direction} {...field} onValueChange={onChange}>
                      <Select.Trigger
                        ref={ref}
                        data-testid="shipping-rule-configure-form-requirement-select"
                      >
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {REQUIREMENTS.map((requirement) => (
                          <Select.Item
                            key={requirement}
                            value={requirement}
                            data-testid={`shipping-rule-configure-form-requirement-option-${requirement}`}
                          >
                            {t(`shippingRules.requirement.${requirement}`)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="price_type"
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>{t("shippingRules.fields.priceType")}</Form.Label>
                  <Form.Control>
                    <Select dir={direction} {...field} onValueChange={onChange}>
                      <Select.Trigger
                        ref={ref}
                        data-testid="shipping-rule-configure-form-price-type-select"
                      >
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {PRICE_TYPES.map((type) => (
                          <Select.Item
                            key={type}
                            value={type}
                            data-testid={`shipping-rule-configure-form-price-type-option-${type}`}
                          >
                            {t(`shippingRules.priceType.${type}`)}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            {priceType === "flat" && currencyCodes.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <div>
                  <Text size="small" leading="compact" weight="plus">
                    {t("shippingRules.fields.prices")}
                  </Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {t("shippingRules.fields.pricesHint")}
                  </Text>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {currencyCodes.map((code) => (
                    <Form.Field
                      key={code}
                      control={form.control}
                      name={`prices.${code}`}
                      render={({ field: { onChange, value, ...field } }) => (
                        <Form.Item>
                          <Form.Label>{code.toUpperCase()}</Form.Label>
                          <Form.Control>
                            <CurrencyInput
                              {...field}
                              symbol={getNativeSymbol(code)}
                              code={code}
                              value={value ?? ""}
                              onValueChange={(next) => onChange(next ?? "")}
                              data-testid={`shipping-rule-configure-form-price-${code}-input`}
                            />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
            <SwitchBox
              control={form.control}
              name="seller_can_edit_price"
              label={t("shippingRules.fields.sellerCanEditPrice")}
              description={t("shippingRules.fields.sellerCanEditPriceHint")}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="transit_min_days"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("shippingRules.fields.transitMinDays")}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        {...field}
                        data-testid="shipping-rule-configure-form-transit-min-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="transit_max_days"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("shippingRules.fields.transitMaxDays")}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        {...field}
                        data-testid="shipping-rule-configure-form-transit-max-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
            <SwitchBox
              control={form.control}
              name="seller_can_edit_transit"
              label={t("shippingRules.fields.sellerCanEditTransit")}
              description={t("shippingRules.fields.sellerCanEditTransitHint")}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
                data-testid="shipping-rule-configure-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="shipping-rule-configure-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
