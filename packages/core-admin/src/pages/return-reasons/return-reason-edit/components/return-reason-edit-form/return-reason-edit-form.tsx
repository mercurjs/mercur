import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateReturnReason } from "../../../../../hooks/api/return-reasons"

type ReturnReasonEditFormProps = {
  returnReason: HttpTypes.AdminReturnReason
}

const ReturnReasonEditSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
})

export const ReturnReasonEditForm = ({
  returnReason,
}: ReturnReasonEditFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof ReturnReasonEditSchema>>({
    defaultValues: {
      value: returnReason.value,
      label: returnReason.label,
      description: returnReason.description ?? undefined,
    },
    resolver: zodResolver(ReturnReasonEditSchema),
  })

  const { mutateAsync, isPending } = useUpdateReturnReason(returnReason.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ return_reason }) => {
        toast.success(
          t("returnReasons.edit.successToast", {
            label: return_reason.label,
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
    <RouteDrawer.Form form={form} data-testid="return-reason-edit-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-auto" data-testid="return-reason-edit-form-body">
          <Form.Field
            control={form.control}
            name="value"
            render={({ field }) => {
              return (
                <Form.Item data-testid="return-reason-edit-form-value-item">
                  <Form.Label tooltip={t("returnReasons.fields.value.tooltip")} data-testid="return-reason-edit-form-value-label">
                    {t("returnReasons.fields.value.label")}
                  </Form.Label>
                  <Form.Control data-testid="return-reason-edit-form-value-control">
                    <Input
                      {...field}
                      placeholder={t("returnReasons.fields.value.placeholder")}
                      data-testid="return-reason-edit-form-value-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="return-reason-edit-form-value-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="label"
            render={({ field }) => {
              return (
                <Form.Item data-testid="return-reason-edit-form-label-item">
                  <Form.Label data-testid="return-reason-edit-form-label-label">
                    {t("returnReasons.fields.label.label")}
                  </Form.Label>
                  <Form.Control data-testid="return-reason-edit-form-label-control">
                    <Input
                      {...field}
                      placeholder={t("returnReasons.fields.label.placeholder")}
                      data-testid="return-reason-edit-form-label-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="return-reason-edit-form-label-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => {
              return (
                <Form.Item data-testid="return-reason-edit-form-description-item">
                  <Form.Label optional data-testid="return-reason-edit-form-description-label">
                    {t("returnReasons.fields.description.label")}
                  </Form.Label>
                  <Form.Control data-testid="return-reason-edit-form-description-control">
                    <Textarea
                      {...field}
                      placeholder={t(
                        "returnReasons.fields.description.placeholder"
                      )}
                      data-testid="return-reason-edit-form-description-input"
                    />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="return-reason-edit-form-description-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="return-reason-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" type="button" data-testid="return-reason-edit-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="return-reason-edit-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
