import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { ApiKeyDTO } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useUpdateApiKey } from "../../../../../hooks/api/api-keys"

type EditApiKeyFormProps = {
  apiKey: ApiKeyDTO
}

const EditApiKeySchema = zod.object({
  title: zod.string().min(1),
})

export const EditApiKeyForm = ({ apiKey }: EditApiKeyFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof EditApiKeySchema>>({
    defaultValues: {
      title: apiKey.title,
    },
    resolver: zodResolver(EditApiKeySchema),
  })

  const { mutateAsync, isPending } = useUpdateApiKey(apiKey.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ api_key }) => {
        toast.success(
          t("apiKeyManagement.edit.successToast", {
            title: api_key.title,
          })
        )
        handleSuccess()
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form} data-testid={`${apiKey.type}-api-key-edit-form`}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body data-testid={`${apiKey.type}-api-key-edit-body`}>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <Form.Item data-testid={`${apiKey.type}-api-key-edit-title-item`}>
                    <Form.Label data-testid={`${apiKey.type}-api-key-edit-title-label`}>{t("fields.title")}</Form.Label>
                    <Form.Control data-testid={`${apiKey.type}-api-key-edit-title-control`}>
                      <Input {...field} data-testid={`${apiKey.type}-api-key-edit-title-input`} />
                    </Form.Control>
                    <Form.ErrorMessage data-testid={`${apiKey.type}-api-key-edit-title-error`} />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid={`${apiKey.type}-api-key-edit-footer`}>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary" data-testid={`${apiKey.type}-api-key-edit-cancel-button`}>
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending} data-testid={`${apiKey.type}-api-key-edit-save-button`}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
