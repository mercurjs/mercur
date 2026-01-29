import { zodResolver } from "@hookform/resolvers/zod"
import type {
  AdminPromotion,
  ApplicationMethodAllocationValues,
} from "@medusajs/types"
import { Button, CurrencyInput, Input, RadioGroup, Text } from "@medusajs/ui"
import { useForm, useWatch } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { useEffect } from "react"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { DeprecatedPercentageInput } from "../../../../../components/inputs/percentage-input"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdatePromotion } from "../../../../../hooks/api/promotions"
import {
  currencies,
  getCurrencySymbol,
} from "../../../../../lib/data/currencies"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"

type EditPromotionFormProps = {
  promotion: AdminPromotion
}

type AllocationMode = "each" | "across" | "once"

const EditPromotionSchema = zod.object({
  is_automatic: zod.string().toLowerCase(),
  code: zod.string().min(1),
  is_tax_inclusive: zod.boolean().optional(),
  status: zod.enum(["active", "inactive", "draft"]),
  value_type: zod.enum(["fixed", "percentage"]),
  value: zod.number().min(0).or(zod.string().min(1)),
  allocation: zod.enum(["each", "across", "once"]),
  max_quantity: zod.number().optional().nullable(),
  target_type: zod.enum(["order", "shipping_methods", "items"]),
})
  .refine(
    (data) => {
      if (data.allocation === "across") {
        return true
      }

      return typeof data.max_quantity === "number"
    },
    {
      path: ["max_quantity"],
      message: `required field`,
    }
  )

export const EditPromotionDetailsForm = ({
  promotion,
}: EditPromotionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const allocationRaw = promotion.application_method?.allocation as
    | string
    | undefined
  const allocationDefault: AllocationMode =
    allocationRaw === "once"
      ? "once"
      : allocationRaw === "across"
        ? "across"
        : "each"

  const form = useForm<zod.infer<typeof EditPromotionSchema>>({
    defaultValues: {
      is_automatic: promotion.is_automatic!.toString(),
      is_tax_inclusive: promotion.is_tax_inclusive,
      code: promotion.code,
      status: promotion.status,
      value: promotion.application_method!.value,
      allocation: allocationDefault,
      max_quantity: promotion.application_method?.max_quantity ?? null,
      value_type: promotion.application_method!.type,
      target_type: promotion.application_method!.target_type,
    },
    resolver: zodResolver(EditPromotionSchema),
  })

  const watchValueType = useWatch({
    control: form.control,
    name: "value_type",
  })

  const watchAllocation = useWatch({
    control: form.control,
    name: "allocation",
  })

  const isFixedValueType = watchValueType === "fixed"

  const { mutateAsync, isPending } = useUpdatePromotion(promotion.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    const value =
      typeof data.value === "number" ? data.value : parseFloat(data.value)

    if (isNaN(value) || value < 0) {
      form.setError("value", { message: t("promotions.form.value.invalid") })

return
    }

    await mutateAsync(
      {
        is_automatic: data.is_automatic === "true",
        code: data.code,
        status: data.status,
        is_tax_inclusive: data.is_tax_inclusive,
        application_method: {
          value,
          type: data.value_type,
          allocation: data.allocation as ApplicationMethodAllocationValues,
          max_quantity: data.max_quantity ?? null,
        },
      },
      {
        onSuccess: () => {
          handleSuccess()
        },
      }
    )
  })

  const allocationWatchValue = useWatch({
    control: form.control,
    name: "value_type",
  })

  useEffect(() => {
    if (!(allocationWatchValue === "fixed" && promotion.type === "standard")) {
      form.setValue("is_tax_inclusive", false)
    }
  }, [allocationWatchValue, form, promotion])

  useEffect(() => {
    if (watchAllocation === "once" && !form.getValues("max_quantity")) {
      form.setValue("max_quantity", 1)
    }
  }, [watchAllocation, form])
  const direction = useDocumentDirection()

return (
    <RouteDrawer.Form form={form} data-testid="promotion-edit-details-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto" data-testid="promotion-edit-details-form-body">
          <div className="flex flex-col gap-y-8">
            <Form.Field
              control={form.control}
              name="status"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="promotion-edit-details-form-status-item">
                    <Form.Label data-testid="promotion-edit-details-form-status-label">{t("promotions.form.status.label")}</Form.Label>
                    <Form.Control data-testid="promotion-edit-details-form-status-control">
                      <RadioGroup
                        dir={direction}
                        className="flex-col gap-y-3"
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                        data-testid="promotion-edit-details-form-status-radio-group"
                      >
                        <RadioGroup.ChoiceBox
                          value="draft"
                          label={t("promotions.form.status.draft.title")}
                          description={t(
                            "promotions.form.status.draft.description"
                          )}
                          data-testid="promotion-edit-details-form-status-option-draft"
                        />

                        <RadioGroup.ChoiceBox
                          value="active"
                          label={t("promotions.form.status.active.title")}
                          description={t(
                            "promotions.form.status.active.description"
                          )}
                          data-testid="promotion-edit-details-form-status-option-active"
                        />

                        <RadioGroup.ChoiceBox
                          value="inactive"
                          label={t("promotions.form.status.inactive.title")}
                          description={t(
                            "promotions.form.status.inactive.description"
                          )}
                          data-testid="promotion-edit-details-form-status-option-inactive"
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="promotion-edit-details-form-status-error" />
                  </Form.Item>
                )
              }}
            />

            <Form.Field
              control={form.control}
              name="is_automatic"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="promotion-edit-details-form-method-item">
                    <Form.Label data-testid="promotion-edit-details-form-method-label">{t("promotions.form.method.label")}</Form.Label>
                    <Form.Control data-testid="promotion-edit-details-form-method-control">
                      <RadioGroup
                        dir={direction}
                        className="flex-col gap-y-3"
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                        data-testid="promotion-edit-details-form-method-radio-group"
                      >
                        <RadioGroup.ChoiceBox
                          value="false"
                          label={t("promotions.form.method.code.title")}
                          description={t(
                            "promotions.form.method.code.description"
                          )}
                          data-testid="promotion-edit-details-form-method-option-code"
                        />
                        <RadioGroup.ChoiceBox
                          value="true"
                          label={t("promotions.form.method.automatic.title")}
                          description={t(
                            "promotions.form.method.automatic.description"
                          )}
                          data-testid="promotion-edit-details-form-method-option-automatic"
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage data-testid="promotion-edit-details-form-method-error" />
                  </Form.Item>
                )
              }}
            />

            {allocationWatchValue === "fixed" &&
              promotion.type === "standard" && (
                <SwitchBox
                  control={form.control}
                  name="is_tax_inclusive"
                  label={t("promotions.form.taxInclusive.title")}
                  description={t("promotions.form.taxInclusive.description")}
                />
              )}

            <div className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="promotion-edit-details-form-code-item">
                      <Form.Label data-testid="promotion-edit-details-form-code-label">{t("promotions.form.code.title")}</Form.Label>
                      <Form.Control data-testid="promotion-edit-details-form-code-control">
                        <Input {...field} data-testid="promotion-edit-details-form-code-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="promotion-edit-details-form-code-error" />
                    </Form.Item>
                  )
                }}
              />

              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                <Trans
                  t={t}
                  i18nKey="promotions.form.code.description"
                  components={[<br key="break" />]}
                />
              </Text>
            </div>

            {promotion.application_method?.target_type !==
              "shipping_methods" && (
              <>
                <Form.Field
                  control={form.control}
                  name="value_type"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="promotion-edit-details-form-value-type-item">
                        <Form.Label data-testid="promotion-edit-details-form-value-type-label">
                          {t("promotions.fields.value_type")}
                        </Form.Label>
                        <Form.Control data-testid="promotion-edit-details-form-value-type-control">
                          <RadioGroup
                            dir={direction}
                            className="flex-col gap-y-3"
                            {...field}
                            onValueChange={field.onChange}
                            data-testid="promotion-edit-details-form-value-type-radio-group"
                          >
                            <RadioGroup.ChoiceBox
                              value="fixed"
                              label={t(
                                "promotions.form.value_type.fixed.title"
                              )}
                              description={t(
                                "promotions.form.value_type.fixed.description"
                              )}
                              data-testid="promotion-edit-details-form-value-type-option-fixed"
                            />

                            <RadioGroup.ChoiceBox
                              value="percentage"
                              label={t(
                                "promotions.form.value_type.percentage.title"
                              )}
                              description={t(
                                "promotions.form.value_type.percentage.description"
                              )}
                              data-testid="promotion-edit-details-form-value-type-option-percentage"
                            />
                          </RadioGroup>
                        </Form.Control>
                        <Form.ErrorMessage data-testid="promotion-edit-details-form-value-type-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="value"
                  render={({ field: { onChange, ...field } }) => {
                    const currencyCode =
                      promotion.application_method?.currency_code ?? "USD"

                    const currencyInfo =
                      currencies[currencyCode?.toUpperCase() || "USD"]

                    return (
                      <Form.Item data-testid="promotion-edit-details-form-value-item">
                        <Form.Label data-testid="promotion-edit-details-form-value-label">
                          {isFixedValueType
                            ? t("fields.amount")
                            : t("fields.percentage")}
                        </Form.Label>
                        <Form.Control data-testid="promotion-edit-details-form-value-control">
                          {isFixedValueType ? (
                            <CurrencyInput
                              min={0}
                              onValueChange={(val) => onChange(val)}
                              decimalSeparator="."
                              groupSeparator=","
                              decimalScale={currencyInfo.decimal_digits}
                              decimalsLimit={currencyInfo.decimal_digits}
                              code={currencyCode}
                              symbol={getCurrencySymbol(currencyCode)}
                              {...field}
                              value={field.value}
                              data-testid="promotion-edit-details-form-value-currency-input"
                            />
                          ) : (
                            <DeprecatedPercentageInput
                              key="amount"
                              min={0}
                              max={100}
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => {
                                onChange(
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value)
                                )
                              }}
                              data-testid="promotion-edit-details-form-value-percentage-input"
                            />
                          )}
                        </Form.Control>
                        <Form.ErrorMessage data-testid="promotion-edit-details-form-value-error" />
                      </Form.Item>
                    )
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="allocation"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="promotion-edit-details-form-allocation-item">
                        <Form.Label data-testid="promotion-edit-details-form-allocation-label">
                          {t("promotions.fields.allocation")}
                        </Form.Label>
                        <Form.Control data-testid="promotion-edit-details-form-allocation-control">
                          <RadioGroup
                            dir={direction}
                            className="flex-col gap-y-3"
                            {...field}
                            onValueChange={field.onChange}
                            data-testid="promotion-edit-details-form-allocation-radio-group"
                          >
                            <RadioGroup.ChoiceBox
                              value="each"
                              label={t("promotions.form.allocation.each.title")}
                              description={t(
                                "promotions.form.allocation.each.description"
                              )}
                              data-testid="promotion-edit-details-form-allocation-option-each"
                            />

                        <RadioGroup.ChoiceBox
                          value="across"
                          label={t("promotions.form.allocation.across.title")}
                          description={t(
                            "promotions.form.allocation.across.description"
                          )}
                          data-testid="promotion-edit-details-form-allocation-option-across"
                        />

                        <RadioGroup.ChoiceBox
                          value="once"
                          label={t("promotions.form.allocation.once.title", {
                            defaultValue: "Once",
                          })}
                          description={t(
                            "promotions.form.allocation.once.description",
                            { defaultValue: "Limit discount to max quantity" }
                          )}
                          data-testid="promotion-edit-details-form-allocation-option-once"
                        />
                          </RadioGroup>
                        </Form.Control>
                        <Form.ErrorMessage data-testid="promotion-edit-details-form-allocation-error" />
                      </Form.Item>
                    )
                  }}
                />

            {(watchAllocation === "each" || watchAllocation === "once") && (
              <Form.Field
                control={form.control}
                name="max_quantity"
                render={() => {
                  return (
                    <Form.Item data-testid="promotion-edit-details-form-max-quantity-item">
                      <Form.Label data-testid="promotion-edit-details-form-max-quantity-label">
                        {t("promotions.form.max_quantity.title")}
                      </Form.Label>
                      <Form.Control data-testid="promotion-edit-details-form-max-quantity-control">
                        <Input
                          {...form.register("max_quantity", {
                            valueAsNumber: true,
                          })}
                          type="number"
                          min={1}
                          placeholder="3"
                          data-testid="promotion-edit-details-form-max-quantity-input"
                        />
                      </Form.Control>
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-fg-subtle"
                        data-testid="promotion-edit-details-form-max-quantity-description"
                      >
                        <Trans
                          t={t}
                          i18nKey="promotions.form.max_quantity.description"
                          components={[<br key="break" />]}
                        />
                      </Text>
                      <Form.ErrorMessage data-testid="promotion-edit-details-form-max-quantity-error" />
                    </Form.Item>
                  )
                }}
              />
            )}
              </>
            )}
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="promotion-edit-details-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="promotion-edit-details-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button size="small" type="submit" isLoading={isPending} data-testid="promotion-edit-details-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
