import { zodResolver } from "@hookform/resolvers/zod"
import {
  Button,
  Heading,
  Input,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateSalesChannel } from "../../../../../hooks/api/sales-channels"

const CreateSalesChannelSchema = zod.object({
  name: zod.string().min(1),
  description: zod.string().min(1),
  enabled: zod.boolean(),
})

export const CreateSalesChannelForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof CreateSalesChannelSchema>>({
    defaultValues: {
      name: "",
      description: "",
      enabled: true,
    },
    resolver: zodResolver(CreateSalesChannelSchema),
  })
  const { mutateAsync, isPending } = useCreateSalesChannel()

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        description: values.description,
        is_disabled: !values.enabled,
      },
      {
        onSuccess: ({ sales_channel }) => {
          toast.success(t("salesChannels.toast.create"))
          handleSuccess(`../${sales_channel.id}`)
        },
        onError: (error) => toast.error(error.message),
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="sales-channel-create-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header data-testid="sales-channel-create-form-header" />
        <RouteFocusModal.Body className="flex flex-1 flex-col overflow-hidden" data-testid="sales-channel-create-form-body">
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div data-testid="sales-channel-create-form-header-section">
                <Heading className="capitalize" data-testid="sales-channel-create-form-heading">
                  {t("salesChannels.createSalesChannel")}
                </Heading>
                <Text size="small" className="text-ui-fg-subtle" data-testid="sales-channel-create-form-hint">
                  {t("salesChannels.createSalesChannelHint")}
                </Text>
              </div>
              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="sales-channel-create-form-name-item">
                          <Form.Label data-testid="sales-channel-create-form-name-label">{t("fields.name")}</Form.Label>
                          <Form.Control data-testid="sales-channel-create-form-name-control">
                            <Input size="small" {...field} data-testid="sales-channel-create-form-name-input" />
                          </Form.Control>
                          <Form.ErrorMessage data-testid="sales-channel-create-form-name-error" />
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
                      <Form.Item data-testid="sales-channel-create-form-description-item">
                        <Form.Label data-testid="sales-channel-create-form-description-label">{t("fields.description")}</Form.Label>
                        <Form.Control data-testid="sales-channel-create-form-description-control">
                          <Textarea {...field} data-testid="sales-channel-create-form-description-input" />
                        </Form.Control>
                        <Form.ErrorMessage data-testid="sales-channel-create-form-description-error" />
                      </Form.Item>
                    )
                  }}
                />
              </div>
              <Form.Field
                control={form.control}
                name="enabled"
                render={({ field: { value, onChange, ...field } }) => {
                  return (
                    <Form.Item data-testid="sales-channel-create-form-enabled-item">
                      <div className="flex items-center justify-between">
                        <Form.Label data-testid="sales-channel-create-form-enabled-label">{t("general.enabled")}</Form.Label>
                        <Form.Control data-testid="sales-channel-create-form-enabled-control">
                          <Switch
                            dir="ltr"
                            className="rtl:rotate-180"
                            {...field}
                            checked={value}
                            onCheckedChange={onChange}
                            data-testid="sales-channel-create-form-enabled-switch"
                          />
                        </Form.Control>
                      </div>
                      <Form.Hint data-testid="sales-channel-create-form-enabled-hint">{t("salesChannels.enabledHint")}</Form.Hint>
                      <Form.ErrorMessage data-testid="sales-channel-create-form-enabled-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="sales-channel-create-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary" data-testid="sales-channel-create-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid="sales-channel-create-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
