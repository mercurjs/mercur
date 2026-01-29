import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { Form } from "../../../../../components/common/form"
import { HandleInput } from "../../../../../components/inputs/handle-input"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateCollection } from "../../../../../hooks/api/collections"

const CreateCollectionSchema = zod.object({
  title: zod.string().min(1),
  handle: zod.string().optional(),
})

export const CreateCollectionForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof CreateCollectionSchema>>({
    defaultValues: {
      title: "",
      handle: "",
    },
    resolver: zodResolver(CreateCollectionSchema),
  })

  const { mutateAsync, isPending } = useCreateCollection()

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: ({ collection }) => {
        handleSuccess(`/collections/${collection.id}`)
        toast.success(t("collections.createSuccess"))
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="collection-create-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />

        <RouteFocusModal.Body className="flex size-full flex-col items-center p-16" data-testid="collection-create-form-body">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8" data-testid="collection-create-form-content">
            <div data-testid="collection-create-form-header">
              <Heading data-testid="collection-create-form-heading">{t("collections.createCollection")}</Heading>
              <Text size="small" className="text-ui-fg-subtle" data-testid="collection-create-form-hint">
                {t("collections.createCollectionHint")}
              </Text>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="collection-create-form-title-item">
                      <Form.Label data-testid="collection-create-form-title-label">{t("fields.title")}</Form.Label>
                      <Form.Control data-testid="collection-create-form-title-control">
                        <Input autoComplete="off" {...field} data-testid="collection-create-form-title-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="collection-create-form-title-error" />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="handle"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="collection-create-form-handle-item">
                      <Form.Label
                        optional
                        tooltip={t("collections.handleTooltip")}
                        data-testid="collection-create-form-handle-label"
                      >
                        {t("fields.handle")}
                      </Form.Label>
                      <Form.Control data-testid="collection-create-form-handle-control">
                        <HandleInput {...field} data-testid="collection-create-form-handle-input" />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="collection-create-form-handle-error" />
                    </Form.Item>
                  )
                }}
              />
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer data-testid="collection-create-form-footer">
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary" data-testid="collection-create-form-cancel-button">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            size="small"
            variant="primary"
            type="submit"
            isLoading={isPending}
            data-testid="collection-create-form-create-button"
          >
            {t("actions.create")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
