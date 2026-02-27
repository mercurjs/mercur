import { zodResolver } from "@hookform/resolvers/zod"
import { MagnifyingGlass } from "@medusajs/icons"
import {
  Button,
  clx,
  CurrencyInput,
  Divider,
  Heading,
  Hint,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { PercentageInput } from "../../../../../components/inputs/percentage-input"
import {
  RouteDrawer,
  StackedDrawer,
  useRouteModal,
  useStackedModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import {
  useBatchCommissionRules,
  useUpdateCommissionRate,
} from "../../../../../hooks/api/commission-rates"
import { useStore } from "../../../../../hooks/api/store"
import { currencies as currencyData } from "../../../../../lib/data/currencies"
import { CommissionRateDTO } from "@mercurjs/types"
import { TargetForm } from "../../../../tax-regions/common/components/target-form/target-form"
import { TargetItem } from "../../../../tax-regions/common/components/target-item/target-item"
import { TaxRateRuleReferenceType } from "../../../../tax-regions/common/constants"
import {
  TaxRateRuleReference,
  TaxRateRuleReferenceSchema,
} from "../../../../tax-regions/common/schemas"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"

const STACKED_MODAL_ID = "cr"
const getStackedModalId = (type: TaxRateRuleReferenceType) =>
  `${STACKED_MODAL_ID}-${type}`

const EditCommissionRateSchema = zod.object({
  name: zod.string().min(1),
  code: zod.string().min(1),
  type: zod.enum(["fixed", "percentage"]),
  target: zod.enum(["item", "shipping"]),
  value: zod.coerce.number().min(0),
  currency_code: zod.string().optional(),
  min_amount: zod.coerce.number().optional(),
  include_tax: zod.boolean(),
  priority: zod.coerce.number().int().min(0),
  enabled_rules: zod.object({
    product: zod.boolean(),
    product_type: zod.boolean(),
    shipping_option: zod.boolean(),
  }),
  product: zod.array(TaxRateRuleReferenceSchema).optional(),
  product_type: zod.array(TaxRateRuleReferenceSchema).optional(),
  shipping_option: zod.array(TaxRateRuleReferenceSchema).optional(),
})

type EditCommissionRateFormProps = {
  commissionRate: CommissionRateDTO
}

const getRulesByType = (
  rules: CommissionRateDTO["rules"],
  type: TaxRateRuleReferenceType
): TaxRateRuleReference[] => {
  return (rules || [])
    .filter((r) => r.reference === type)
    .map((r) => ({ value: r.reference_id, label: "" }))
}

export const EditCommissionRateForm = ({
  commissionRate,
}: EditCommissionRateFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const { setIsOpen } = useStackedModal()
  const direction = useDocumentDirection()

  const initialProducts = getRulesByType(
    commissionRate.rules,
    TaxRateRuleReferenceType.PRODUCT
  )
  const initialProductTypes = getRulesByType(
    commissionRate.rules,
    TaxRateRuleReferenceType.PRODUCT_TYPE
  )
  const initialShippingOptions = getRulesByType(
    commissionRate.rules,
    TaxRateRuleReferenceType.SHIPPING_OPTION
  )

  const form = useForm<zod.infer<typeof EditCommissionRateSchema>>({
    defaultValues: {
      name: commissionRate.name,
      code: commissionRate.code,
      type: commissionRate.type,
      target: commissionRate.target,
      value: commissionRate.value,
      currency_code: commissionRate.currency_code ?? "",
      min_amount: commissionRate.min_amount ?? undefined,
      include_tax: commissionRate.include_tax,
      priority: commissionRate.priority,
      enabled_rules: {
        product: initialProducts.length > 0,
        product_type: initialProductTypes.length > 0,
        shipping_option: initialShippingOptions.length > 0,
      },
      product: initialProducts,
      product_type: initialProductTypes,
      shipping_option: initialShippingOptions,
    },
    resolver: zodResolver(EditCommissionRateSchema),
  })

  const { store } = useStore()

  const storeCurrencies = (store?.supported_currencies ?? []).map(
    (c) => currencyData[c.currency_code.toUpperCase()]
  )

  const defaultCurrencyCode =
    store?.supported_currencies?.[0]?.currency_code ?? ""

  const { mutateAsync: updateCommissionRate, isPending: isUpdating } =
    useUpdateCommissionRate(commissionRate.id)

  const { mutateAsync: batchRules, isPending: isBatching } =
    useBatchCommissionRules(commissionRate.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    const newRules = [
      ...(values.product || []).map((ref) => ({
        reference: TaxRateRuleReferenceType.PRODUCT,
        reference_id: ref.value,
      })),
      ...(values.product_type || []).map((ref) => ({
        reference: TaxRateRuleReferenceType.PRODUCT_TYPE,
        reference_id: ref.value,
      })),
      ...(values.shipping_option || []).map((ref) => ({
        reference: TaxRateRuleReferenceType.SHIPPING_OPTION,
        reference_id: ref.value,
      })),
    ]

    const existingRules = commissionRate.rules || []

    const toCreate = newRules.filter(
      (nr) =>
        !existingRules.some(
          (er) =>
            er.reference === nr.reference &&
            er.reference_id === nr.reference_id
        )
    )

    const toDelete = existingRules
      .filter(
        (er) =>
          !newRules.some(
            (nr) =>
              nr.reference === er.reference &&
              nr.reference_id === er.reference_id
          )
      )
      .map((er) => er.id)

    try {
      await updateCommissionRate({
        name: values.name,
        code: values.code,
        type: values.type,
        target: values.target,
        value: values.value,
        currency_code: values.currency_code || null,
        min_amount: values.min_amount ?? null,
        include_tax: values.include_tax,
        priority: values.priority,
      })

      if (toCreate.length > 0 || toDelete.length > 0) {
        await batchRules({
          ...(toCreate.length > 0 ? { create: toCreate } : {}),
          ...(toDelete.length > 0 ? { delete: toDelete } : {}),
        })
      }

      toast.success("Commission rate updated successfully")
      handleSuccess()
    } catch (e: any) {
      toast.error(e.message)
    }
  })

  const watchType = form.watch("type")
  const watchCurrency = form.watch("currency_code")

  const products = useFieldArray({
    control: form.control,
    name: TaxRateRuleReferenceType.PRODUCT,
  })

  const productTypes = useFieldArray({
    control: form.control,
    name: TaxRateRuleReferenceType.PRODUCT_TYPE,
  })

  const shippingOptions = useFieldArray({
    control: form.control,
    name: TaxRateRuleReferenceType.SHIPPING_OPTION,
  })

  const getControls = (type: TaxRateRuleReferenceType) => {
    switch (type) {
      case TaxRateRuleReferenceType.PRODUCT:
        return products
      case TaxRateRuleReferenceType.PRODUCT_TYPE:
        return productTypes
      case TaxRateRuleReferenceType.SHIPPING_OPTION:
        return shippingOptions
    }
  }

  const referenceTypeOptions = [
    {
      value: TaxRateRuleReferenceType.PRODUCT,
      label: t("taxRegions.fields.targets.options.product"),
    },
    {
      value: TaxRateRuleReferenceType.PRODUCT_TYPE,
      label: t("taxRegions.fields.targets.options.productType"),
    },
    {
      value: TaxRateRuleReferenceType.SHIPPING_OPTION,
      label: t("taxRegions.fields.targets.options.shippingOption"),
    },
  ]

  const searchPlaceholders = {
    [TaxRateRuleReferenceType.PRODUCT]: t(
      "taxRegions.fields.targets.placeholders.product"
    ),
    [TaxRateRuleReferenceType.PRODUCT_TYPE]: t(
      "taxRegions.fields.targets.placeholders.productType"
    ),
    [TaxRateRuleReferenceType.SHIPPING_OPTION]: t(
      "taxRegions.fields.targets.placeholders.shippingOption"
    ),
  }

  const getFieldHandler = (type: TaxRateRuleReferenceType) => {
    const { fields, remove, prepend } = getControls(type)
    const modalId = getStackedModalId(type)

    return (references: TaxRateRuleReference[]) => {
      if (!references.length) {
        form.setValue(type, [], { shouldDirty: true })
        setIsOpen(modalId, false)
        return
      }

      const newIds = references.map((reference) => reference.value)

      const fieldsToAdd = references.filter(
        (reference) => !fields.some((field) => field.value === reference.value)
      )

      for (const field of fields) {
        if (!newIds.includes(field.value)) {
          remove(fields.indexOf(field))
        }
      }

      prepend(fieldsToAdd)
      setIsOpen(modalId, false)
    }
  }

  const displayOrder = new Set<TaxRateRuleReferenceType>(
    [
      initialProducts.length > 0 ? TaxRateRuleReferenceType.PRODUCT : null,
      initialProductTypes.length > 0
        ? TaxRateRuleReferenceType.PRODUCT_TYPE
        : null,
      initialShippingOptions.length > 0
        ? TaxRateRuleReferenceType.SHIPPING_OPTION
        : null,
    ].filter(Boolean) as TaxRateRuleReferenceType[]
  )

  const disableRule = (type: TaxRateRuleReferenceType) => {
    form.setValue(type, [], { shouldDirty: true })
    form.setValue(`enabled_rules.${type}`, false, { shouldDirty: true })
    displayOrder.delete(type)
  }

  const enableRule = (type: TaxRateRuleReferenceType) => {
    form.setValue(`enabled_rules.${type}`, true, { shouldDirty: true })
    form.setValue(type, [], { shouldDirty: true })
    displayOrder.add(type)
  }

  const watchedEnabledRules = useWatch({
    control: form.control,
    name: "enabled_rules",
  })

  const addRule = () => {
    const firstDisabledRule = Object.keys(watchedEnabledRules).find(
      (key) => !watchedEnabledRules[key as TaxRateRuleReferenceType]
    )

    if (firstDisabledRule) {
      enableRule(firstDisabledRule as TaxRateRuleReferenceType)
    }
  }

  const visibleRuleTypes = referenceTypeOptions
    .filter((option) => watchedEnabledRules[option.value])
    .sort((a, b) => {
      const orderArray = Array.from(displayOrder)
      return orderArray.indexOf(a.value) - orderArray.indexOf(b.value)
    })

  const getAvailableRuleTypes = (type: TaxRateRuleReferenceType) => {
    return referenceTypeOptions.filter((option) => {
      return (
        !visibleRuleTypes.some(
          (visibleOption) => visibleOption.value === option.value
        ) || option.value === type
      )
    })
  }

  const showAddButton = Object.values(watchedEnabledRules).some(
    (value) => !value
  )

  const isPending = isUpdating || isBatching

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        className="flex flex-1 flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-6 overflow-auto">
          <div className="grid grid-cols-1 gap-4">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Name</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Code</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="type"
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>Type</Form.Label>
                  <Form.Control>
                    <Select {...field} onValueChange={onChange}>
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="percentage">Percentage</Select.Item>
                        <Select.Item value="fixed">Fixed</Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="target"
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>Target</Form.Label>
                  <Form.Control>
                    <Select {...field} onValueChange={onChange}>
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="item">Item</Select.Item>
                        <Select.Item value="shipping">Shipping</Select.Item>
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="currency_code"
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>Currency Code</Form.Label>
                  <Form.Control>
                    <Select {...field} onValueChange={onChange}>
                      <Select.Trigger ref={ref}>
                        <Select.Value placeholder="Select currency" />
                      </Select.Trigger>
                      <Select.Content>
                        {storeCurrencies.map((currency) => (
                          <Select.Item
                            value={currency.code.toLowerCase()}
                            key={currency.code}
                          >
                            {currency.name}
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
              name="value"
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Item>
                  <Form.Label>Rate</Form.Label>
                  <Form.Control>
                    {watchType === "percentage" ? (
                      <PercentageInput
                        {...field}
                        value={value}
                        onValueChange={(_value, _name, values) =>
                          onChange(values?.float ?? 0)
                        }
                      />
                    ) : (
                      <CurrencyInput
                        {...field}
                        min={0}
                        code={watchCurrency || defaultCurrencyCode}
                        onValueChange={(_value, _name, values) =>
                          onChange(values?.float ?? 0)
                        }
                      />
                    )}
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="min_amount"
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Item>
                  <Form.Label>Minimum Amount</Form.Label>
                  <Form.Control>
                    <CurrencyInput
                      {...field}
                      min={0}
                      code={watchCurrency || defaultCurrencyCode}
                      value={value}
                      onValueChange={(_value, _name, values) =>
                        onChange(values?.float ?? 0)
                      }
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="priority"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>Priority</Form.Label>
                  <Form.Control>
                    <Input type="number" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="include_tax"
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Item>
                  <div className="flex items-start justify-between">
                    <Form.Label>Include Tax</Form.Label>
                    <Form.Control>
                      <Switch
                        {...field}
                        checked={value}
                        onCheckedChange={onChange}
                      />
                    </Form.Control>
                  </div>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between gap-x-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-x-1">
                  <Label
                    id="commission_rules_label"
                    htmlFor="commission_rules"
                  >
                    {t("taxRegions.fields.targets.label")}
                  </Label>
                  <Text
                    size="small"
                    leading="compact"
                    className="text-ui-fg-muted"
                  >
                    ({t("fields.optional")})
                  </Text>
                </div>
                <Hint
                  id="commission_rules_description"
                  className="text-pretty"
                >
                  {t("taxRegions.fields.targets.hint")}
                </Hint>
              </div>
              {showAddButton && (
                <Button
                  onClick={addRule}
                  type="button"
                  size="small"
                  variant="transparent"
                  className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover flex-shrink-0"
                >
                  {t("taxRegions.fields.targets.action")}
                </Button>
              )}
            </div>
            <div
              id="commission_rules"
              aria-labelledby="commission_rules_label"
              aria-describedby="commission_rules_description"
              role="application"
              className="flex flex-col gap-y-3"
            >
              {visibleRuleTypes.map((ruleType, index) => {
                const type = ruleType.value
                const label = ruleType.label
                const isLast = index === visibleRuleTypes.length - 1
                const searchPlaceholder = searchPlaceholders[type]

                const options = getAvailableRuleTypes(type)
                const modalId = getStackedModalId(type)

                const { fields, remove } = getControls(type)
                const handler = getFieldHandler(type)

                const handleChangeType = (
                  value: TaxRateRuleReferenceType
                ) => {
                  disableRule(type)
                  enableRule(value)
                }

                return (
                  <div key={type}>
                    <Form.Field
                      control={form.control}
                      name={ruleType.value}
                      render={({
                        field: { value: _value, onChange: _onChange, ...field },
                      }) => {
                        return (
                          <Form.Item className="space-y-0">
                            <Form.Label className="sr-only">
                              {label}
                            </Form.Label>
                            <div
                              className={clx(
                                "bg-ui-bg-component shadow-elevation-card-rest transition-fg grid gap-1.5 rounded-xl py-1.5",
                                "aria-[invalid='true']:shadow-borders-error"
                              )}
                              role="application"
                              {...field}
                            >
                              <div className="text-ui-fg-subtle grid gap-1.5 px-1.5 md:grid-cols-2">
                                {isLast ? (
                                  <Select
                                    dir={direction}
                                    value={type}
                                    onValueChange={handleChangeType}
                                  >
                                    <Select.Trigger className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover">
                                      <Select.Value />
                                    </Select.Trigger>
                                    <Select.Content>
                                      {options.map((option) => {
                                        return (
                                          <Select.Item
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {option.label}
                                          </Select.Item>
                                        )
                                      })}
                                    </Select.Content>
                                  </Select>
                                ) : (
                                  <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
                                    {label}
                                  </div>
                                )}
                                <div className="bg-ui-bg-field shadow-borders-base txt-compact-small rounded-md px-2 py-1.5">
                                  {t(
                                    "taxRegions.fields.targets.operators.in"
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 px-1.5">
                                <StackedDrawer id={modalId}>
                                  <StackedDrawer.Trigger asChild>
                                    <button
                                      type="button"
                                      className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover shadow-borders-base txt-compact-small text-ui-fg-muted transition-fg focus-visible:shadow-borders-interactive-with-active flex flex-1 items-center gap-x-2 rounded-md px-2 py-1.5 outline-none"
                                    >
                                      <MagnifyingGlass />
                                      {searchPlaceholder}
                                    </button>
                                  </StackedDrawer.Trigger>
                                  <StackedDrawer.Trigger asChild>
                                    <Button variant="secondary">
                                      {t("actions.browse")}
                                    </Button>
                                  </StackedDrawer.Trigger>
                                  <StackedDrawer.Content>
                                    <StackedDrawer.Header>
                                      <StackedDrawer.Title asChild>
                                        <Heading>
                                          {t(
                                            "taxRegions.fields.targets.modal.header"
                                          )}
                                        </Heading>
                                      </StackedDrawer.Title>
                                      <StackedDrawer.Description className="sr-only">
                                        {t("taxRegions.fields.targets.hint")}
                                      </StackedDrawer.Description>
                                    </StackedDrawer.Header>
                                    <TargetForm
                                      type="drawer"
                                      referenceType={type}
                                      state={fields}
                                      setState={handler}
                                    />
                                  </StackedDrawer.Content>
                                </StackedDrawer>
                                <Button
                                  variant="secondary"
                                  onClick={() => disableRule(type)}
                                  type="button"
                                >
                                  {t("actions.delete")}
                                </Button>
                              </div>
                              {fields.length > 0 ? (
                                <div className="flex flex-col gap-y-1.5">
                                  <Divider variant="dashed" />
                                  <div className="flex flex-col gap-y-1.5 px-1.5">
                                    {fields.map((field, index) => {
                                      return (
                                        <TargetItem
                                          key={field.id}
                                          index={index}
                                          label={field.label}
                                          value={field.value}
                                          onRemove={remove}
                                        />
                                      )
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                            <Form.ErrorMessage className="mt-2" />
                          </Form.Item>
                        )
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <RouteDrawer.Close asChild>
            <Button size="small" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </RouteDrawer.Close>
          <Button size="small" type="submit" isLoading={isPending}>
            {t("actions.save")}
          </Button>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
