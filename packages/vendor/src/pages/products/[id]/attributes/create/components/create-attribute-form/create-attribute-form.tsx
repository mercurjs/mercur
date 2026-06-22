import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Hint,
  Input,
  Label,
  Switch,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { ChipInput } from "@components/inputs/chip-input"
import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useAddProductAttribute } from "@hooks/api/products"

const normalizeValues = (raw: string | string[]): string[] =>
  (Array.isArray(raw)
    ? raw
    : raw.split(",")
  )
    .map((v) => v.trim())
    .filter(Boolean)

const buildSchema = (messages: { title: string; values: string }) =>
  zod
    .object({
      title: zod.string().min(1, { message: messages.title }),
      values: zod.union([zod.string(), zod.array(zod.string())]),
      use_for_variants: zod.boolean(),
    })
    .superRefine((data, ctx) => {
      if (normalizeValues(data.values).length === 0) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: ["values"],
          message: messages.values,
        })
      }
    })

type CreateAttributeFormProps = {
  productId: string
}

export const CreateAttributeForm = ({
  productId,
}: CreateAttributeFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const schema = useMemo(
    () =>
      buildSchema({
        title: t("products.create.attributes.errors.titleRequired"),
        values: t("products.create.attributes.errors.valuesRequired"),
      }),
    [t]
  )

  type FormValues = zod.infer<typeof schema>

  const form = useForm<FormValues>({
    defaultValues: {
      title: "",
      values: "",
      use_for_variants: false,
    },
    resolver: zodResolver(schema),
  })

  const useForVariants = form.watch("use_for_variants")

  const { mutateAsync: createAttribute, isPending } =
    useAddProductAttribute(productId)

  const handleSubmit = form.handleSubmit(async (data) => {
    await createAttribute(
      {
        name: data.title,
        type: data.use_for_variants ? "multi_select" : "text",
        is_variant_axis: data.use_for_variants,
        values: normalizeValues(data.values),
      },
      {
        onSuccess: () => {
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <div className="bg-ui-bg-component shadow-elevation-card-rest rounded-xl p-1.5">
              <div className="grid grid-cols-[min-content,1fr] items-start gap-1.5">
                <div className="flex items-center px-2 py-1.5">
                  <Label
                    size="xsmall"
                    weight="plus"
                    className="text-ui-fg-subtle"
                  >
                    {t("fields.title")}
                  </Label>
                </div>
                <Form.Field
                  control={form.control}
                  name="title"
                  render={({ field, fieldState }) => (
                    <Form.Item>
                      <Form.Control>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid ? "true" : undefined}
                          className={
                            fieldState.invalid
                              ? "bg-ui-bg-field-component shadow-borders-error focus:shadow-borders-error"
                              : "bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                          }
                          placeholder={t(
                            "products.create.attributes.titlePlaceholder"
                          )}
                          data-testid="create-attribute-title-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <div className="flex items-center px-2 py-1.5">
                  <Label
                    size="xsmall"
                    weight="plus"
                    className="text-ui-fg-subtle"
                  >
                    {t("fields.values")}
                  </Label>
                </div>
                <Form.Field
                  control={form.control}
                  name="values"
                  render={({ field: { onChange, value, ...field }, fieldState }) => (
                    <Form.Item>
                      <Form.Control>
                        {useForVariants ? (
                          <ChipInput
                            {...field}
                            variant="contrast"
                            value={Array.isArray(value) ? value : []}
                            onChange={onChange}
                            aria-invalid={
                              fieldState.invalid ? "true" : undefined
                            }
                            className={
                              fieldState.invalid
                                ? "shadow-borders-error focus-within:!shadow-borders-error"
                                : undefined
                            }
                            placeholder={t(
                              "products.create.attributes.valuePlaceholder"
                            )}
                          />
                        ) : (
                          <Textarea
                            {...field}
                            aria-invalid={
                              fieldState.invalid ? "true" : undefined
                            }
                            className={
                              fieldState.invalid
                                ? "bg-ui-bg-field-component shadow-borders-error focus:shadow-borders-error"
                                : "bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                            }
                            value={
                              Array.isArray(value)
                                ? value.join(", ")
                                : value ?? ""
                            }
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={t(
                              "products.create.attributes.valuePlaceholder"
                            )}
                            data-testid="create-attribute-values-input"
                          />
                        )}
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <div />
                <Form.Field
                  control={form.control}
                  name="use_for_variants"
                  render={({
                    field: { value, onChange: fieldOnChange, ref },
                  }) => (
                    <Form.Item>
                      <div className="flex items-start gap-x-3 py-1.5">
                        <Form.Control>
                          <Switch
                            ref={ref}
                            className="shrink-0 rtl:rotate-180"
                            checked={value}
                            onCheckedChange={(checked) => {
                              fieldOnChange(checked)
                              form.setValue("values", checked ? [] : "", {
                                shouldValidate: form.formState.isSubmitted,
                              })
                            }}
                          />
                        </Form.Control>
                        <div className="flex flex-col">
                          <Label size="xsmall" weight="plus">
                            {t("products.create.attributes.useForVariants")}
                          </Label>
                          <Hint className="!txt-small">
                            {t(
                              "products.create.attributes.useForVariantsDescription"
                            )}
                          </Hint>
                        </div>
                      </div>
                    </Form.Item>
                  )}
                />
              </div>
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="create-attribute-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
