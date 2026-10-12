import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, toast } from "@medusajs/ui"
import {
  Form,
  KeyboundForm,
  RouteDrawer,
  useRouteModal,
} from "@mercurjs/dashboard-shared"
import { HttpTypes } from "@mercurjs/types"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { SwitchBox } from "../../../../../components/common/switch-box"
import { useUpdateOfferCondition } from "../../../../../hooks/api"

type OfferConditionEditFormProps = {
  offerCondition: HttpTypes.AdminOfferConditionResponse["offer_condition"]
}

const OfferConditionEditSchema = z.object({
  label: z.string().min(1),
  code: z.string().min(1),
  rank: z.number().int().min(0).optional(),
  is_active: z.boolean(),
})

export const OfferConditionEditForm = ({
  offerCondition,
}: OfferConditionEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof OfferConditionEditSchema>>({
    defaultValues: {
      label: offerCondition.label,
      code: offerCondition.code,
      rank: offerCondition.rank,
      is_active: offerCondition.is_active,
    },
    resolver: zodResolver(OfferConditionEditSchema),
  })

  const { mutateAsync, isPending } = useUpdateOfferCondition(offerCondition.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ offer_condition }) => {
        toast.success(
          t("offerConditions.edit.successToast", {
            label: offer_condition.label,
          })
        )
        handleSuccess()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid="offer-condition-edit-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto">
          <Form.Field
            control={form.control}
            name="label"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label>
                    {t("offerConditions.fields.label.label")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      placeholder={t(
                        "offerConditions.fields.label.placeholder"
                      )}
                      data-testid="offer-condition-edit-form-label-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="code"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label
                    tooltip={t("offerConditions.fields.code.tooltip")}
                  >
                    {t("offerConditions.fields.code.label")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      placeholder={t("offerConditions.fields.code.placeholder")}
                      data-testid="offer-condition-edit-form-code-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="rank"
            render={({ field }) => {
              return (
                <Form.Item>
                  <Form.Label
                    optional
                    tooltip={t("offerConditions.fields.rank.tooltip")}
                  >
                    {t("offerConditions.fields.rank.label")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                      data-testid="offer-condition-edit-form-rank-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )
            }}
          />
          <SwitchBox
            control={form.control}
            name="is_active"
            label={t("offerConditions.fields.isActive.label")}
            description={t("offerConditions.fields.isActive.hint")}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="offer-condition-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                variant="secondary"
                size="small"
                type="button"
                data-testid="offer-condition-edit-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="offer-condition-edit-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
