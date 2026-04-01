import { zodResolver } from "@hookform/resolvers/zod"
import { Button, InlineTip, Input, usePrompt } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "@components/common/form"
import { SwitchBox } from "@components/common/switch-box"
import { Combobox } from "@components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { i18n } from "@components/utilities/i18n"
import { KeyboundForm } from "@components/utilities/keybound-form"
import {
  useProductAttributes,
  useUpdateProductOption,
} from "@hooks/api/products"
import type { ExtendedAdminProductOption } from "@pages/products/types"

type EditProductOptionFormProps = {
  option: ExtendedAdminProductOption
}

const EditProductOptionSchema = z.object({
  title: z
    .string()
    .min(1, i18n.t("products.edit.attributes.titleRequired")),
  values: z
    .array(z.string())
    .min(1, i18n.t("products.edit.attributes.valuesRequired")),
  use_for_variations: z.boolean(),
})

export const EditProductOptionForm = ({
  option,
}: EditProductOptionFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const prompt = usePrompt()

  const isAdminOption = option.metadata?.author === "admin"

  const { attributes } = useProductAttributes(option.product_id!)
  const attributeDefinition = attributes?.find(
    (a: any) =>
      a.id === option.metadata?.attribute_id || a.name === option.title
  )
  const predefinedValueOptions =
    attributeDefinition?.possible_values?.map((v: any) => ({
      value: v.value,
      label: v.value,
    })) ?? []

  const currentValueOptions = (option?.values ?? []).map((v) => ({
    value: v.value,
    label: v.value,
  }))

  const seenValues = new Set<string>()
  const allValueOptions = [...predefinedValueOptions, ...currentValueOptions].filter(
    (o) => {
      if (seenValues.has(o.value)) return false
      seenValues.add(o.value)
      return true
    }
  )

  const form = useForm<z.infer<typeof EditProductOptionSchema>>({
    defaultValues: {
      title: option.title,
      values: option?.values?.map((v) => v.value),
      use_for_variations: true,
    },
    resolver: zodResolver(EditProductOptionSchema),
  })

  const useForVariations = form.watch("use_for_variations")

  const { mutateAsync: updateOption, isPending } = useUpdateProductOption(
    option.product_id!,
    option.id
  )

  const handleSubmit = form.handleSubmit(async (data) => {
    if (isAdminOption) {
      if (data.title !== option.title) {
        const confirmed = await prompt({
          title: t(
            "products.edit.attributes.editCustomValueTitle",
            "Edit Attribute"
          ),
          description: t(
            "products.edit.attributes.editCustomValueDescription",
            "Replacing this attribute with a custom one will affect how your products appear in search and filters. Custom attributes are not searchable or filterable. Do you want to continue?"
          ),
        })

        if (!confirmed) return
      }

      await updateOption(
        {
          title: data.title,
          values: data.values,
          metadata: { author: "vendor" },
        } as any,
        {
          onSuccess: () => handleSuccess(),
        }
      )

      return
    }

    const { use_for_variations, ...rest } = data

    if (!use_for_variations) {
      await updateOption({ convert_to_attribute: true } as any, {
        onSuccess: () => handleSuccess(),
      })

      return
    }

    await updateOption(rest as any, { onSuccess: () => handleSuccess() })
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
          <div className="flex flex-col gap-y-2 rounded-xl border bg-ui-bg-component p-1.5">
            <div className="flex flex-col gap-y-2">
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <Form.Item className="flex flex-row items-start gap-x-1.5 space-y-0 [&>div:last-child]:w-full">
                      <Form.Label className="min-w-[60px] px-2 py-1.5">
                        {t("products.fields.options.optionTitle")}
                      </Form.Label>
                      <Form.Control>
                        <div className="flex w-full flex-col gap-y-1.5">
                          <Input
                            {...field}
                            disabled={!useForVariations}
                            placeholder={t(
                              "products.fields.options.optionTitlePlaceholder"
                            )}
                            className="w-full bg-ui-bg-base"
                          />
                          <Form.ErrorMessage />
                        </div>
                      </Form.Control>
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="values"
                render={({ field }) => {
                  return (
                    <Form.Item className="flex flex-row items-start gap-x-1.5 space-y-0">
                      <Form.Label className="min-w-[60px] px-2 py-1.5">
                        {t("products.fields.options.variations")}
                      </Form.Label>
                      <Form.Control>
                        <div className="flex w-full flex-col gap-y-1.5">
                          <Combobox
                            value={field.value}
                            onChange={(val) => field.onChange(val ?? [])}
                            options={allValueOptions}
                            disabled={!useForVariations}
                            placeholder={t(
                              "products.fields.options.variantionsPlaceholder"
                            )}
                            className="w-full bg-ui-bg-base"
                          />
                          <Form.ErrorMessage />
                        </div>
                      </Form.Control>
                    </Form.Item>
                  )
                }}
              />
            </div>
            <SwitchBox
              control={form.control}
              name="use_for_variations"
              label={t("products.edit.attributes.useForVariations")}
              description={t(
                "products.edit.attributes.useForVariationsDescription"
              )}
              className="pl-14 [&>*]:shadow-none"
            />
          </div>

          {!useForVariations && (
            <InlineTip variant="warning" label={t("general.warning")}>
              {t("products.edit.attributes.conversionWarning")}
            </InlineTip>
          )}
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
