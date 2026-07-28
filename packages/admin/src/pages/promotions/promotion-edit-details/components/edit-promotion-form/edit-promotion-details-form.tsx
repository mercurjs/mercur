import type {
  AdminPromotion,
  ApplicationMethodAllocationValues,
} from "@medusajs/types"
import {
  Button,
  CurrencyInput,
  Divider,
  InlineTip,
  Input,
  RadioGroup,
  Text,
  toast,
} from "@medusajs/ui"
import { useWatch } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { useEffect } from "react"
import * as zod from "zod"

import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"

import { Form } from "../../../../../components/common/form"
import { DeprecatedPercentageInput } from "../../../../../components/inputs/percentage-input"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import {
  useUpdatePromotion,
  useUpsertPromotionCost,
} from "../../../../../hooks/api/promotions"
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
  cost_bearer: zod.enum(["store", "marketplace", "shared"]),
  shared_marketplace_percentage: zod.number().min(0).max(100).nullable(),
  limit: zod.number().int().min(1).nullable().optional(),
})

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

  const promotionWithLinks = promotion as AdminPromotion & {
    seller?: { id?: string } | null
    promotion_cost?: {
      cost_bearer?: "store" | "marketplace" | "shared" | null
      shared_marketplace_percentage?: number | null
    } | null
  }

  // Coverage (who bears the discount cost) is only editable for
  // marketplace-owned promotions; when a store owns it, the field is hidden.
  const isMercurOwned = !promotionWithLinks.seller

  const costDefault =
    promotionWithLinks.promotion_cost?.cost_bearer ?? "store"
  const sharedPercentageDefault =
    promotionWithLinks.promotion_cost?.shared_marketplace_percentage ?? null

  const form = useExtendableForm({
    schema: EditPromotionSchema,
    model: "promotion",
    zone: "edit",
    data: promotion,
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
      cost_bearer: costDefault,
      shared_marketplace_percentage: sharedPercentageDefault,
      limit: promotion.limit ?? null,
    },
  })

  const watchValueType = useWatch({
    control: form.control,
    name: "value_type",
  })

  const watchAllocation = useWatch({
    control: form.control,
    name: "allocation",
  })

  const watchCostBearer = useWatch({
    control: form.control,
    name: "cost_bearer",
  })

  const isFixedValueType = watchValueType === "fixed"
  const isSharedCost = watchCostBearer === "shared"
  const isOrderTargetType =
    promotion.application_method?.target_type === "order"

  const { mutateAsync, isPending } = useUpdatePromotion(promotion.id)
  const { mutateAsync: upsertPromotionCost } = useUpsertPromotionCost()

  const handleSubmit = form.handleSubmit(async (data) => {
    const value =
      typeof data.value === "number" ? data.value : parseFloat(data.value)

    if (isNaN(value) || value < 0) {
      form.setError("value", { message: t("promotions.form.value.invalid") })

return
    }

    if (
      !isOrderTargetType &&
      data.allocation !== "across" &&
      typeof data.max_quantity !== "number"
    ) {
      form.setError("max_quantity", {
        message: t("validation.requiredField"),
      })

      return
    }

    if (
      isMercurOwned &&
      data.cost_bearer === "shared" &&
      typeof data.shared_marketplace_percentage !== "number"
    ) {
      form.setError("shared_marketplace_percentage", {
        message: t("validation.requiredField"),
      })

      return
    }

    await mutateAsync(
      {
        is_automatic: data.is_automatic === "true",
        code: data.code,
        status: data.status,
        is_tax_inclusive: data.is_tax_inclusive,
        limit: data.limit ?? null,
        application_method: {
          value,
          type: data.value_type,
          allocation: data.allocation as ApplicationMethodAllocationValues,
          max_quantity: data.max_quantity ?? null,
        },
      },
      {
        onSuccess: async () => {
          if (isMercurOwned) {
            try {
              await upsertPromotionCost({
                id: promotion.id,
                cost_bearer: data.cost_bearer,
                shared_marketplace_percentage:
                  data.cost_bearer === "shared"
                    ? data.shared_marketplace_percentage
                    : null,
              })
            } catch (e) {
              toast.error((e as Error).message)
            }
          }

          toast.success(t("promotions.toasts.promotionUpdateSuccess"))
          handleSuccess()
        },
        onError: (e) => {
          toast.error((e as Error).message)
        },
      }
    )
  })

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

            <SwitchBox
              control={form.control}
              name="is_tax_inclusive"
              label={t("promotions.form.taxInclusive.title")}
              description={t("promotions.form.taxInclusive.description")}
            />

            <Divider />

            {isMercurOwned && (
              <>
              <div className="flex flex-col gap-y-4">
                <Form.Field
                  control={form.control}
                  name="cost_bearer"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="promotion-edit-details-form-cost-bearer-item">
                        <Form.Label data-testid="promotion-edit-details-form-cost-bearer-label">
                          {t("promotions.fields.coverage")}
                        </Form.Label>
                        <Form.Control data-testid="promotion-edit-details-form-cost-bearer-control">
                          <RadioGroup
                            dir={direction}
                            className="flex-col gap-y-3"
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                            data-testid="promotion-edit-details-form-cost-bearer-radio-group"
                          >
                            <RadioGroup.ChoiceBox
                              value="store"
                              label={t("promotions.form.costBearer.store.title")}
                              description={t(
                                "promotions.form.costBearer.store.description"
                              )}
                              data-testid="promotion-edit-details-form-cost-bearer-option-store"
                            />

                            <RadioGroup.ChoiceBox
                              value="marketplace"
                              label={t(
                                "promotions.form.costBearer.marketplace.title"
                              )}
                              description={t(
                                "promotions.form.costBearer.marketplace.description"
                              )}
                              data-testid="promotion-edit-details-form-cost-bearer-option-marketplace"
                            />

                            <RadioGroup.ChoiceBox
                              value="shared"
                              label={t(
                                "promotions.form.costBearer.shared.title"
                              )}
                              description={t(
                                "promotions.form.costBearer.shared.description"
                              )}
                              data-testid="promotion-edit-details-form-cost-bearer-option-shared"
                            />
                          </RadioGroup>
                        </Form.Control>
                        <Form.ErrorMessage data-testid="promotion-edit-details-form-cost-bearer-error" />
                      </Form.Item>
                    )
                  }}
                />

                {isSharedCost && (
                  <Form.Field
                    control={form.control}
                    name="shared_marketplace_percentage"
                    render={({ field: { onChange, value, ...field } }) => {
                      return (
                        <Form.Item data-testid="promotion-edit-details-form-shared-percentage-item">
                          <Form.Label data-testid="promotion-edit-details-form-shared-percentage-label">
                            {t("promotions.form.costBearer.sharedPercentage.title")}
                          </Form.Label>
                          <Form.Control data-testid="promotion-edit-details-form-shared-percentage-control">
                            <DeprecatedPercentageInput
                              key="shared-percentage"
                              className="text-right"
                              min={0}
                              max={100}
                              {...field}
                              value={value ?? ""}
                              onChange={(e) => {
                                onChange(
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value)
                                )
                              }}
                              data-testid="promotion-edit-details-form-shared-percentage-input"
                            />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="promotion-edit-details-form-shared-percentage-error" />
                        </Form.Item>
                      )
                    }}
                  />
                )}

                <InlineTip
                  label={t("general.tip")}
                  data-testid="promotion-edit-details-form-cost-bearer-tip"
                >
                  {t("promotions.form.costBearer.tip")}
                </InlineTip>
              </div>

              <Divider />
              </>
            )}

            {promotion.application_method?.target_type !==
              "shipping_methods" && (
              <>
                {promotion.application_method?.target_type !== "order" && (
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
                          value="once"
                          label={t("promotions.form.allocation.once.title")}
                          description={t("promotions.form.allocation.once.description")}
                          data-testid="promotion-edit-details-form-allocation-option-once"
                        />
                          </RadioGroup>
                        </Form.Control>
                        <Form.ErrorMessage data-testid="promotion-edit-details-form-allocation-error" />
                      </Form.Item>
                    )
                  }}
                />
                )}
                {promotion.type !== "buyget" && (
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
                            ? t("promotions.fields.promotion_value")
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
                        {isFixedValueType && (
                          <Text
                            size="small"
                            leading="compact"
                            className="text-ui-fg-subtle"
                            data-testid="promotion-edit-details-form-value-description"
                          >
                            {t("promotions.form.value.description")}
                          </Text>
                        )}
                        <Form.ErrorMessage data-testid="promotion-edit-details-form-value-error" />
                      </Form.Item>
                    )
                  }}
                />
                )}

            {!isOrderTargetType &&
              (watchAllocation === "each" || watchAllocation === "once") && (
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

            <Divider />

            <Form.Field
              control={form.control}
              name="limit"
              render={({ field: { onChange, value, ...field } }) => {
                return (
                  <Form.Item data-testid="promotion-edit-details-form-limit-item">
                    <Form.Label
                      optional
                      data-testid="promotion-edit-details-form-limit-label"
                    >
                      {t("promotions.form.limit.title")}
                    </Form.Label>
                    <Form.Control data-testid="promotion-edit-details-form-limit-control">
                      <Input
                        {...field}
                        type="number"
                        min={1}
                        value={value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value
                          onChange(val === "" ? null : parseInt(val, 10))
                        }}
                        placeholder="100"
                        data-testid="promotion-edit-details-form-limit-input"
                      />
                    </Form.Control>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                      data-testid="promotion-edit-details-form-limit-description"
                    >
                      {t("promotions.form.limit.description")}
                    </Text>
                    <Form.ErrorMessage data-testid="promotion-edit-details-form-limit-error" />
                  </Form.Item>
                )
              }}
            />

            <FormExtensionZone
              model="promotion"
              zone="edit"
              control={form.control}
              data={promotion}
            />
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
