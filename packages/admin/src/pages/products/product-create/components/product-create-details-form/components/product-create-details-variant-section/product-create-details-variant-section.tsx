import {
  Alert,
  Checkbox,
  clx,
  Heading,
  Hint,
  InlineTip,
  Label,
  Text,
} from "@medusajs/ui"
import {
  FieldArrayWithId,
  useFieldArray,
  useWatch,
} from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../../../components/common/form"
import { SortableList } from "../../../../../../../components/common/sortable-list"
import { SwitchBox } from "../../../../../../../components/common/switch-box"
import { useTabbedForm } from "../../../../../../../components/tabbed-form/tabbed-form"
import { ProductCreateSchemaType } from "../../../../types"
import { decorateVariantsWithDefaultValues } from "../../../../utils"
import { useEffect, useMemo } from "react"

const getPermutations = (
  data: { title: string; values: string[] }[]
): { [key: string]: string }[] => {
  if (data.length === 0) {
    return []
  }

  if (data.length === 1) {
    return data[0].values.map((value) => ({ [data[0].title]: value }))
  }

  const toProcess = data[0]
  const rest = data.slice(1)

  return toProcess.values.flatMap((value) => {
    return getPermutations(rest).map((permutation) => {
      return {
        [toProcess.title]: value,
        ...permutation,
      }
    })
  })
}

const getVariantName = (options: Record<string, string>) => {
  return Object.values(options).join(" / ")
}

export const ProductCreateVariantsSection = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { t } = useTranslation()

  const variants = useFieldArray({
    control: form.control,
    name: "variants",
  })

  const watchedAreVariantsEnabled = useWatch({
    control: form.control,
    name: "enable_variants",
    defaultValue: false,
  })

  const watchedAttributes = useWatch({
    control: form.control,
    name: "attributes",
    defaultValue: [],
  })

  const watchedVariants = useWatch({
    control: form.control,
    name: "variants",
    defaultValue: [],
  })

  // Derive variant axis options from attributes with use_for_variants
  const variantAxes = useMemo(() => {
    return (watchedAttributes ?? [])
      .filter((attr) => attr.use_for_variants)
      .map((attr) => ({
        title: attr.title,
        values: Array.isArray(attr.values)
          ? attr.values
          : attr.values
            ? [attr.values]
            : [],
      }))
      .filter((axis) => axis.title && axis.values.length > 0)
  }, [watchedAttributes])

  // Regenerate variants when variant axes change
  useEffect(() => {
    if (!watchedAreVariantsEnabled) return

    const { isTouched: hasUserSelectedVariants } =
      form.getFieldState("variants")

    const permutations = getPermutations(variantAxes)
    const oldVariants = [...watchedVariants]

    const newVariants = oldVariants.reduce((acc, variant) => {
      const match = permutations.find((perm) =>
        Object.keys(variant.attribute_values).every(
          (key) => variant.attribute_values[key] === perm[key]
        )
      )

      if (match) {
        acc.push({
          ...variant,
          title: getVariantName(match),
          attribute_values: match,
        })
      }

      return acc
    }, [] as typeof oldVariants)

    const usedPermutations = new Set(
      newVariants.map((v) => JSON.stringify(v.attribute_values))
    )
    const unusedPermutations = permutations.filter(
      (perm) => !usedPermutations.has(JSON.stringify(perm))
    )

    unusedPermutations.forEach((perm) => {
      newVariants.push({
        title: getVariantName(perm),
        attribute_values: perm,
        should_create: hasUserSelectedVariants ? false : true,
        variant_rank: newVariants.length,
        inventory: [{ inventory_item_id: "", required_quantity: "" }],
      })
    })

    // Only update if the variants actually changed
    if (JSON.stringify(newVariants.map((v) => v.attribute_values)) !== JSON.stringify(oldVariants.map((v) => v.attribute_values))) {
      form.setValue("variants", newVariants)
    }
  }, [variantAxes, watchedAreVariantsEnabled])

  const showInvalidVariantsMessage =
    form.formState.errors.variants?.root?.message === "invalid_length"

  const handleRankChange = (
    items: FieldArrayWithId<ProductCreateSchemaType, "variants">[]
  ) => {
    const update = items.map((item, index) => {
      const variant = watchedVariants.find((v) => v.title === item.title)

      return {
        id: item.id,
        ...(variant || item),
        variant_rank: index,
      }
    })

    variants.replace(update)
  }

  const getCheckboxState = (variants: ProductCreateSchemaType["variants"]) => {
    if (variants.every((variant) => variant.should_create)) {
      return true
    }

    if (variants.some((variant) => variant.should_create)) {
      return "indeterminate"
    }

    return false
  }

  const onCheckboxChange = (value: boolean | "indeterminate") => {
    switch (value) {
      case true: {
        const update = watchedVariants.map((variant) => ({
          ...variant,
          should_create: true,
        }))
        form.setValue("variants", update)
        break
      }
      case false: {
        const update = watchedVariants.map((variant) => ({
          ...variant,
          should_create: false,
        }))
        form.setValue("variants", decorateVariantsWithDefaultValues(update))
        break
      }
      case "indeterminate":
        break
    }
  }

  const createDefaultVariant = () => {
    form.setValue(
      "variants",
      decorateVariantsWithDefaultValues([
        {
          title: "Default variant",
          should_create: true,
          variant_rank: 0,
          attribute_values: {},
          inventory: [{ inventory_item_id: "", required_quantity: "" }],
          is_default: true,
        },
      ])
    )
  }

  const hasVariantAxes = variantAxes.length > 0

  return (
    <div id="variants" className="flex flex-col gap-y-8" data-testid="product-create-variants-section">
      <div className="flex flex-col gap-y-6" data-testid="product-create-variants-section-header">
        <Heading level="h2" data-testid="product-create-variants-section-heading">
          {t("products.create.variants.header")}
        </Heading>
        <SwitchBox
          control={form.control}
          name="enable_variants"
          label={t("products.create.variants.subHeadingTitle")}
          description={t("products.create.variants.subHeadingDescription")}
          data-testid="product-create-variants-section-enable-switch"
          onCheckedChange={(checked) => {
            if (checked) {
              form.setValue("variants", [])
            } else {
              createDefaultVariant()
            }
          }}
        />
      </div>
      {watchedAreVariantsEnabled && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-8">
          <div className="flex flex-col gap-y-6">
            <div className="flex flex-col">
              <Label weight="plus">
                {t("products.create.variants.productVariants.label")}
              </Label>
              <Hint>
                {t("products.create.variants.productVariants.hint")}
              </Hint>
            </div>

            {!hasVariantAxes && (
              <Alert data-testid="product-create-variants-section-no-axes-alert">
                {t("products.create.variants.productVariants.noAxes")}
              </Alert>
            )}

            {showInvalidVariantsMessage && (
              <Alert dismissible variant="error" data-testid="product-create-variants-section-variants-error">
                {t("products.create.errors.variants")}
              </Alert>
            )}
            {variants.fields.length > 0 ? (
              <div className="overflow-hidden rounded-xl border" data-testid="product-create-variants-section-variants-list">
                <div
                  className="bg-ui-bg-component text-ui-fg-subtle grid items-center gap-3 border-b px-6 py-2.5"
                  style={{
                    gridTemplateColumns: `20px 28px repeat(${variantAxes.length}, 1fr)`,
                  }}
                  data-testid="product-create-variants-section-variants-header"
                >
                  <div>
                    <Checkbox
                      className="relative"
                      checked={getCheckboxState(watchedVariants)}
                      onCheckedChange={onCheckboxChange}
                      data-testid="product-create-variants-section-variants-select-all"
                    />
                  </div>
                  <div />
                  {variantAxes.map((axis, index) => (
                    <div key={index}>
                      <Text size="small" leading="compact" weight="plus">
                        {axis.title}
                      </Text>
                    </div>
                  ))}
                </div>
                <SortableList
                  items={variants.fields}
                  onChange={handleRankChange}
                  renderItem={(item, index) => {
                    return (
                      <SortableList.Item
                        id={item.id}
                        className={clx("bg-ui-bg-base border-b", {
                          "border-b-0": index === variants.fields.length - 1,
                        })}
                      >
                        <div
                          className="text-ui-fg-subtle grid w-full items-center gap-3 px-6 py-2.5"
                          style={{
                            gridTemplateColumns: `20px 28px repeat(${variantAxes.length}, 1fr)`,
                          }}
                        >
                          <Form.Field
                            control={form.control}
                            name={`variants.${index}.should_create` as const}
                            render={({
                              field: { value, onChange, ...field },
                            }) => {
                              return (
                                <Form.Item>
                                  <Form.Control>
                                    <Checkbox
                                      className="relative"
                                      {...field}
                                      checked={value}
                                      onCheckedChange={onChange}
                                      data-testid={`product-create-variants-section-variant-checkbox-${index}`}
                                    />
                                  </Form.Control>
                                </Form.Item>
                              )
                            }}
                          />
                          <SortableList.DragHandle />
                          {variantAxes.map((axis, i) => (
                            <Text key={i} size="small" leading="compact">
                              {item.attribute_values[axis.title] ?? "-"}
                            </Text>
                          ))}
                        </div>
                      </SortableList.Item>
                    )
                  }}
                />
              </div>
            ) : hasVariantAxes ? (
              <Alert data-testid="product-create-variants-section-variants-empty-alert">
                {t("products.create.variants.productVariants.alert")}
              </Alert>
            ) : null}
            {variants.fields.length > 0 && (
              <InlineTip label={t("general.tip")}>
                {t("products.create.variants.productVariants.tip")}
              </InlineTip>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
