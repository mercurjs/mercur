import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useEffect, useRef } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams, useSearchParams } from "react-router-dom"
import { Trash } from "@medusajs/icons"

import { ActionMenu } from "../../../components/common/action-menu"
import { Form } from "../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../components/modals"
import { KeyboundForm } from "../../../components/utilities/keybound-form"
import {
  useProductAttribute,
  useUpdateProductAttributeValue,
} from "../../../hooks/api/product-attributes"
import { UpdatePossibleValueSchema } from "../attribute-edit/schema"
import type { UpdatePossibleValueFormValues } from "../attribute-edit/types"

type EditPossibleValueFormProps = {
  attributeId: string
  possibleValue: Record<string, any>
}

const EditPossibleValueForm = ({
  attributeId,
  possibleValue,
}: EditPossibleValueFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const originalMetadataRef = useRef<Record<string, unknown>>({})

  const { mutateAsync, isPending: isMutating } =
    useUpdateProductAttributeValue(attributeId, possibleValue.id)

  const form = useForm<UpdatePossibleValueFormValues>({
    resolver: zodResolver(UpdatePossibleValueSchema),
    defaultValues: {
      value: "",
      rank: undefined,
      metadata: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "metadata",
  })

  useEffect(() => {
    if (possibleValue) {
      const originalMetadata = possibleValue.metadata || {}
      originalMetadataRef.current = originalMetadata

      const metadataArray = Object.entries(originalMetadata).map(
        ([key, value]) => ({ key, value: String(value) })
      )

      form.reset({
        value: possibleValue.value,
        rank: possibleValue.rank,
        metadata:
          metadataArray.length > 0 ? metadataArray : [{ key: "", value: "" }],
      })
    }
  }, [possibleValue, form])

  const handleSubmit = form.handleSubmit(async (data) => {
    const transformedMetadata = data.metadata.reduce(
      (acc, item) => {
        if (item.key.trim() !== "" && item.value.trim() !== "") {
          acc[item.key] = item.value
        }
        return acc
      },
      {} as Record<string, unknown>
    )

    const finalMetadata: Record<string, unknown> = { ...transformedMetadata }

    const originalKeys = Object.keys(originalMetadataRef.current)
    const newKeys = Object.keys(transformedMetadata)

    originalKeys.forEach((key) => {
      if (!newKeys.includes(key)) {
        finalMetadata[key] = ""
      }
    })

    await mutateAsync(
      {
        value: data.value,
        rank: data.rank,
        metadata: finalMetadata,
      } as any,
      {
        onSuccess: () => {
          toast.success(
            t("attributes.editPossibleValue.successToast", {
              value: data.value,
            })
          )
          handleSuccess()
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="attribute-edit-possible-value-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body
          className="flex flex-1 flex-col gap-y-6 overflow-auto"
          data-testid="attribute-edit-possible-value-form-body"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Field
              control={form.control}
              name="value"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("attributes.fields.value")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="rank"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("attributes.fields.rank")}</Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>

          {/* Metadata Editor */}
          <div>
            <Text size="small" weight="plus" className="mb-2">
              {t("attributes.fields.metadata")}
            </Text>
            <table className="w-full overflow-hidden rounded-lg border-separate border-spacing-0 border">
              <thead>
                <tr className="bg-ui-bg-subtle">
                  <th className="border-b border-r px-3 py-2 text-left">
                    <Text size="small" weight="plus">{t("fields.key")}</Text>
                  </th>
                  <th className="border-b px-3 py-2 text-left">
                    <Text size="small" weight="plus">{t("attributes.fields.value")}</Text>
                  </th>
                  <th className="w-10 border-b" />
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-b last:border-b-0">
                    <td className="border-r px-3 py-2">
                      <input
                        placeholder="Key"
                        className="w-full bg-transparent text-sm outline-none"
                        {...form.register(`metadata.${index}.key`)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        placeholder="Value"
                        className="w-full bg-transparent text-sm outline-none"
                        {...form.register(`metadata.${index}.value`)}
                      />
                    </td>
                    <td className="px-1">
                      <ActionMenu
                        groups={[
                          {
                            actions: [
                              {
                                label: t("actions.delete"),
                                onClick: () => remove(index),
                                icon: <Trash />,
                              },
                            ],
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="border-t p-3">
                    <Button
                      type="button"
                      variant="secondary"
                      size="small"
                      className="w-full"
                      onClick={() => append({ key: "", value: "" })}
                    >
                      + Add Row
                    </Button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" type="button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isMutating}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

export const AttributeEditPossibleValue = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const possibleValueId = searchParams.get("possible_value_id")

  const { product_attribute: attribute, isPending, isError, error } = useProductAttribute(id!)

  if (isError) {
    throw error
  }

  if (isPending || !attribute) {
    return null
  }

  const possibleValue = attribute.values?.find(
    (pv: { id: string }) => pv.id === possibleValueId
  )

  if (!possibleValue) {
    return null
  }

  return (
    <RouteDrawer data-testid="attribute-edit-possible-value-drawer">
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("attributes.editPossibleValue.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("attributes.editPossibleValue.subtitle")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <EditPossibleValueForm
        attributeId={id!}
        possibleValue={possibleValue}
      />
    </RouteDrawer>
  )
}
