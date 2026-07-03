import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams, useSearchParams } from "react-router-dom"

import { Form } from "../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../components/modals"
import { KeyboundForm } from "../../../components/utilities/keybound-form"
import {
  useProductAttribute,
  useUpdateProductAttributeValue,
} from "../../../hooks/api/product-attributes"
import { UpdatePossibleValueSchema } from "../attribute-edit/schema"
import type { UpdatePossibleValueFormValues } from "../attribute-edit/types"

type PossibleValue = {
  id: string
  name: string
  rank: number | null
}

type EditPossibleValueFormProps = {
  attributeId: string
  possibleValue: PossibleValue
}

const EditPossibleValueForm = ({
  attributeId,
  possibleValue,
}: EditPossibleValueFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const { mutateAsync, isPending } = useUpdateProductAttributeValue(
    attributeId,
    possibleValue.id
  )

  const form = useForm<UpdatePossibleValueFormValues>({
    resolver: zodResolver(UpdatePossibleValueSchema),
    defaultValues: {
      name: possibleValue.name,
      rank: possibleValue.rank ?? undefined,
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        name: data.name,
        rank: data.rank,
      },
      {
        onSuccess: () => {
          toast.success(
            t("attributes.editPossibleValue.successToast", {
              value: data.name,
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
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>{t("attributes.fields.value")}</Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="off"
                        data-testid="attribute-edit-possible-value-name-input"
                        {...field}
                      />
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
                    <Form.Label optional>
                      {t("attributes.fields.rank")}
                    </Form.Label>
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
                        data-testid="attribute-edit-possible-value-rank-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="attribute-edit-possible-value-submit-button"
            >
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

  const {
    product_attribute: attribute,
    isPending,
    isError,
    error,
  } = useProductAttribute(id!)

  if (isError) {
    throw error
  }

  const possibleValue = attribute?.values?.find(
    (pv: { id: string }) => pv.id === possibleValueId
  ) as PossibleValue | undefined

  const ready = !isPending && !!attribute && !!possibleValue

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
      {ready && (
        <EditPossibleValueForm
          attributeId={id!}
          possibleValue={possibleValue}
        />
      )}
    </RouteDrawer>
  )
}
