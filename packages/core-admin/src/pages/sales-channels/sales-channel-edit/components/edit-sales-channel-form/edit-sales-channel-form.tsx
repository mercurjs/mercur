import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, Switch, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { SalesChannelDTO } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateSalesChannel } from "../../../../../hooks/api/sales-channels"

type EditSalesChannelFormProps = {
  salesChannel: SalesChannelDTO
}

const EditSalesChannelSchema = zod.object({
  name: zod.string().min(1),
  description: zod.string().optional(),
  is_active: zod.boolean(),
})

export const EditSalesChannelForm = ({
  salesChannel,
}: EditSalesChannelFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof EditSalesChannelSchema>>({
    defaultValues: {
      name: salesChannel.name,
      description: salesChannel.description ?? "",
      is_active: !salesChannel.is_disabled,
    },
    resolver: zodResolver(EditSalesChannelSchema),
  })

  const { mutateAsync, isPending } = useUpdateSalesChannel(salesChannel.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        description: values.description ?? undefined,
        is_disabled: !values.is_active,
      },
      {
        onSuccess: () => {
          toast.success(t("salesChannels.toast.update"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form} data-testid="sales-channel-edit-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex max-w-full flex-1 flex-col gap-y-8 overflow-y-auto" data-testid="sales-channel-edit-form-body">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => {
              return (
                <Form.Item data-testid="sales-channel-edit-form-name-item">
                  <Form.Label data-testid="sales-channel-edit-form-name-label">{t("fields.name")}</Form.Label>
                  <Form.Control data-testid="sales-channel-edit-form-name-control">
                    <Input {...field} size="small" data-testid="sales-channel-edit-form-name-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="sales-channel-edit-form-name-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="description"
            render={({ field }) => {
              return (
                <Form.Item data-testid="sales-channel-edit-form-description-item">
                  <Form.Label optional data-testid="sales-channel-edit-form-description-label">{t("fields.description")}</Form.Label>
                  <Form.Control data-testid="sales-channel-edit-form-description-control">
                    <Textarea {...field} data-testid="sales-channel-edit-form-description-input" />
                  </Form.Control>
                  <Form.ErrorMessage data-testid="sales-channel-edit-form-description-error" />
                </Form.Item>
              )
            }}
          />
          <Form.Field
            control={form.control}
            name="is_active"
            render={({ field: { onChange, value, ...field } }) => {
              return (
                <Form.Item data-testid="sales-channel-edit-form-enabled-item">
                  <div className="flex items-center justify-between">
                    <Form.Label data-testid="sales-channel-edit-form-enabled-label">{t("general.enabled")}</Form.Label>
                    <Form.Control data-testid="sales-channel-edit-form-enabled-control">
                      <Switch
                        dir="ltr"
                        className="rtl:rotate-180"
                        onCheckedChange={onChange}
                        checked={value}
                        {...field}
                        data-testid="sales-channel-edit-form-enabled-switch"
                      />
                    </Form.Control>
                  </div>
                  <Form.Hint data-testid="sales-channel-edit-form-enabled-hint">{t("salesChannels.enabledHint")}</Form.Hint>
                  <Form.ErrorMessage data-testid="sales-channel-edit-form-enabled-error" />
                </Form.Item>
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="sales-channel-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid="sales-channel-edit-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="sales-channel-edit-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
