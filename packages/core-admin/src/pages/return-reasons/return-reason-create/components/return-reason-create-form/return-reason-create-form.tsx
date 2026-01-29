import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateReturnReason } from "../../../../../hooks/api/return-reasons"

const ReturnReasonCreateSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
})

export const ReturnReasonCreateForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof ReturnReasonCreateSchema>>({
    defaultValues: {
      value: "",
      label: "",
      description: "",
    },
    resolver: zodResolver(ReturnReasonCreateSchema),
  })

  const { mutateAsync, isPending } = useCreateReturnReason()

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ return_reason }) => {
        toast.success(
          t("returnReasons.create.successToast", {
            label: return_reason.label,
          })
        )
        handleSuccess(`../`)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="return-reason-create-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header data-testid="return-reason-create-form-header" />
        <RouteFocusModal.Body className="flex flex-1 justify-center overflow-auto px-6 py-16" data-testid="return-reason-create-form-body">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div className="flex flex-col gap-y-1" data-testid="return-reason-create-form-header-section">
              <RouteFocusModal.Title asChild>
                <Heading data-testid="return-reason-create-form-heading">{t("returnReasons.create.header")}</Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text size="small" className="text-ui-fg-subtle" data-testid="return-reason-create-form-subtitle">
                  {t("returnReasons.create.subtitle")}
                </Text>
              </RouteFocusModal.Description>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="value"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="return-reason-create-form-value-item">
                      <Form.Label
                        tooltip={t("returnReasons.fields.value.tooltip")}
                        data-testid="return-reason-create-form-value-label"
                      >
                        {t("returnReasons.fields.value.label")}
                      </Form.Label>
                      <Form.Control data-testid="return-reason-create-form-value-control">
                        <Input
                          {...field}
                          placeholder={t(
                            "returnReasons.fields.value.placeholder"
                          )}
                          data-testid="return-reason-create-form-value-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="return-reason-create-form-value-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="label"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="return-reason-create-form-label-item">
                      <Form.Label data-testid="return-reason-create-form-label-label">
                        {t("returnReasons.fields.label.label")}
                      </Form.Label>
                      <Form.Control data-testid="return-reason-create-form-label-control">
                        <Input
                          {...field}
                          placeholder={t(
                            "returnReasons.fields.label.placeholder"
                          )}
                          data-testid="return-reason-create-form-label-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="return-reason-create-form-label-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="return-reason-create-form-description-item">
                    <Form.Label optional data-testid="return-reason-create-form-description-label">
                      {t("returnReasons.fields.description.label")}
                    </Form.Label>
                    <Form.Control data-testid="return-reason-create-form-description-control">
                      <Textarea
                        {...field}
                        placeholder={t(
                          "returnReasons.fields.description.placeholder"
                        )}
                        data-testid="return-reason-create-form-description-input"
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="return-reason-create-form-description-error" />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="return-reason-create-form-footer">
          <div className="flex items-center justify-end gap-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" type="button" data-testid="return-reason-create-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="return-reason-create-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
