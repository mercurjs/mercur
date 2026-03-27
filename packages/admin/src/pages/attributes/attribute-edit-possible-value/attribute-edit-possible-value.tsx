import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, toast } from "@medusajs/ui"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

import { Form } from "../../../components/common/form"
import { RouteDrawer } from "../../../components/modals"
import { KeyboundForm } from "../../../components/utilities/keybound-form"
import { useAttribute, useUpdateAttributePossibleValue } from "../../../hooks/api/attributes"
import { ATTRIBUTE_DETAIL_FIELDS } from "../attribute-detail/constants"
import { UpdatePossibleValueSchema } from "../attribute-edit/schema"
import type { UpdatePossibleValueFormValues } from "../attribute-edit/types"

export const AttributeEditPossibleValue = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const possibleValueId = searchParams.get("possible_value_id")

  const { attribute, isPending, isError, error } = useAttribute(id!, {
    fields: ATTRIBUTE_DETAIL_FIELDS,
  })

  const { mutateAsync, isPending: isMutating } = useUpdateAttributePossibleValue(
    id!,
    possibleValueId!
  )

  const possibleValue = attribute?.possible_values?.find(
    (pv: { id: string }) => pv.id === possibleValueId
  )

  const form = useForm<UpdatePossibleValueFormValues>({
    resolver: zodResolver(UpdatePossibleValueSchema),
    defaultValues: {
      value: "",
      rank: undefined,
    },
  })

  useEffect(() => {
    if (possibleValue) {
      form.reset({
        value: possibleValue.value,
        rank: possibleValue.rank,
      })
    }
  }, [possibleValue, form])

  if (isError) {
    throw error
  }

  if (isPending || !attribute || !possibleValue) {
    return null
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: () => {
        toast.success(
          t("attributes.editPossibleValue.successToast", {
            value: data.value,
          })
        )
        navigate(`/settings/attributes/${id}`)
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  })

  return (
    <RouteDrawer data-testid="attribute-edit-possible-value-drawer">
      <RouteDrawer.Header data-testid="attribute-edit-possible-value-drawer-header">
        <RouteDrawer.Title asChild>
          <Heading data-testid="attribute-edit-possible-value-drawer-heading">
            {t("attributes.editPossibleValue.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("attributes.editPossibleValue.subtitle")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <RouteDrawer.Form form={form} data-testid="attribute-edit-possible-value-form">
        <KeyboundForm
          className="flex size-full flex-col overflow-hidden"
          onSubmit={handleSubmit}
        >
          <RouteDrawer.Body
            className="flex flex-1 flex-col gap-y-4 overflow-auto"
            data-testid="attribute-edit-possible-value-form-body"
          >
            <Form.Field
              control={form.control}
              name="value"
              render={({ field }) => (
                <Form.Item data-testid="attribute-edit-possible-value-value-item">
                  <Form.Label data-testid="attribute-edit-possible-value-value-label">
                    {t("attributes.fields.value", "Value")}
                  </Form.Label>
                  <Form.Control data-testid="attribute-edit-possible-value-value-control">
                    <Input {...field} data-testid="attribute-edit-possible-value-value-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="attribute-edit-possible-value-value-error" />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="rank"
              render={({ field }) => (
                <Form.Item data-testid="attribute-edit-possible-value-rank-item">
                  <Form.Label optional data-testid="attribute-edit-possible-value-rank-label">
                    {t("attributes.fields.rank", "Rank")}
                  </Form.Label>
                  <Form.Control data-testid="attribute-edit-possible-value-rank-control">
                    <Input
                      {...field}
                      type="number"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )
                      }
                      data-testid="attribute-edit-possible-value-rank-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="attribute-edit-possible-value-rank-error" />
                </Form.Item>
              )}
            />
          </RouteDrawer.Body>
          <RouteDrawer.Footer data-testid="attribute-edit-possible-value-form-footer">
            <div className="flex items-center justify-end gap-x-2">
              <RouteDrawer.Close asChild>
                <Button
                  variant="secondary"
                  size="small"
                  type="button"
                  data-testid="attribute-edit-possible-value-cancel-button"
                >
                  {t("actions.cancel")}
                </Button>
              </RouteDrawer.Close>
              <Button
                size="small"
                type="submit"
                isLoading={isMutating}
                data-testid="attribute-edit-possible-value-save-button"
              >
                {t("actions.save")}
              </Button>
            </div>
          </RouteDrawer.Footer>
        </KeyboundForm>
      </RouteDrawer.Form>
    </RouteDrawer>
  )
}
