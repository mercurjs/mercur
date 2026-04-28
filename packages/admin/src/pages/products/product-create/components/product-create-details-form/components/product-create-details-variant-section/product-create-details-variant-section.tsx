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
import { FieldArrayWithId, useFieldArray, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Form } from "../../../../../../../components/common/form"
import { SortableList } from "../../../../../../../components/common/sortable-list"
import { useTabbedForm } from "../../../../../../../components/tabbed-form/tabbed-form"
import { ProductCreateSchemaType } from "../../../../types"
import { decorateVariantsWithDefaultValues } from "../../../../utils"
import { useMemo } from "react"

export const ProductCreateVariantsSection = () => {
  const form = useTabbedForm<ProductCreateSchemaType>()
  const { t } = useTranslation()

  const variants = useFieldArray({
    control: form.control,
    name: "variants",
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

  const hasVariantAxes = variantAxes.length > 0

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

  if (!hasVariantAxes) {
    return null
  }

  return (
    <div
      id="variants"
      className="flex flex-col gap-y-8"
      data-testid="product-create-variants-section"
    >
      <div className="flex flex-col gap-y-6">
        <Heading level="h2">
          {t("products.create.variants.header")}
        </Heading>
      </div>
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

          {showInvalidVariantsMessage && (
            <Alert dismissible variant="error">
              {t("products.create.errors.variants")}
            </Alert>
          )}
          {variants.fields.length > 0 ? (
            <div className="overflow-hidden rounded-xl border">
              <div
                className="bg-ui-bg-component text-ui-fg-subtle grid items-center gap-3 border-b px-6 py-2.5"
                style={{
                  gridTemplateColumns: `20px 28px repeat(${variantAxes.length}, 1fr)`,
                }}
              >
                <div>
                  <Checkbox
                    className="relative"
                    checked={getCheckboxState(watchedVariants)}
                    onCheckedChange={onCheckboxChange}
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
                          }) => (
                            <Form.Item>
                              <Form.Control>
                                <Checkbox
                                  className="relative"
                                  {...field}
                                  checked={value}
                                  onCheckedChange={onChange}
                                />
                              </Form.Control>
                            </Form.Item>
                          )}
                        />
                        <SortableList.DragHandle />
                        {variantAxes.map((axis, i) => (
                          <Text key={i} size="small" leading="compact">
                            {item.attribute_values?.[axis.title] ?? "-"}
                          </Text>
                        ))}
                      </div>
                    </SortableList.Item>
                  )
                }}
              />
            </div>
          ) : (
            <Alert>
              {t("products.create.variants.productVariants.alert")}
            </Alert>
          )}
          {variants.fields.length > 0 && (
            <InlineTip label={t("general.tip")}>
              {t("products.create.variants.productVariants.tip")}
            </InlineTip>
          )}
        </div>
      </div>
    </div>
  )
}
