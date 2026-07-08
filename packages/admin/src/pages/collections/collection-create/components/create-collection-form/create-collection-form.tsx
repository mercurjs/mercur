import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Input, Text, toast } from "@medusajs/ui"
import i18n from "i18next"
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
import {
  CollectionIconInput,
  CollectionIconTip,
  CollectionMediaInput,
  uploadCollectionImages,
} from "../../../common/components/collection-image-fields"

const CollectionMediaSchema = zod.object({
  url: zod.string(),
  file: zod.any().nullable(),
  is_thumbnail: zod.boolean(),
  is_banner: zod.boolean(),
  field_id: zod.string().optional(),
})

const CollectionIconSchema = zod.object({
  url: zod.string(),
  file: zod.any().nullable(),
})

const CreateCollectionSchema = zod.object({
  title: zod
    .string()
    .min(1, { message: i18n.t("collections.validation.titleRequired") }),
  handle: zod.string().optional(),
  media: zod.array(CollectionMediaSchema).optional(),
  icon: CollectionIconSchema.nullable().optional(),
})

export const CreateCollectionForm = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<zod.infer<typeof CreateCollectionSchema>>({
    defaultValues: {
      title: "",
      handle: "",
      media: [],
      icon: null,
    },
    resolver: zodResolver(CreateCollectionSchema),
  })

  const { mutateAsync, isPending } = useCreateCollection()

  const handleSubmit = form.handleSubmit(async (data) => {
    const { media, icon, ...rest } = data

    const images = await uploadCollectionImages({
      media: media ?? [],
      icon: icon ?? null,
    })

    await mutateAsync(
      { ...rest, ...images },
      {
        onSuccess: ({ collection }) => {
          handleSuccess(`/collections/${collection.id}`)
          toast.success(t("collections.createSuccess"))
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form} data-testid="collection-create-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />

        <RouteFocusModal.Body className="flex size-full flex-col items-center overflow-auto p-16" data-testid="collection-create-form-body">
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
            <Form.Field
              control={form.control}
              name="media"
              render={({ field: { value, onChange } }) => (
                <Form.Item data-testid="collection-create-form-media-item">
                  <Form.Label optional>{t("collections.media.label")}</Form.Label>
                  <Form.Control>
                    <CollectionMediaInput
                      value={value ?? []}
                      onChange={onChange}
                      hasError={!!form.formState.errors.media}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="icon"
              render={({ field: { value, onChange } }) => (
                <Form.Item data-testid="collection-create-form-icon-item">
                  <Form.Label optional>{t("collections.icon.label")}</Form.Label>
                  <Form.Control>
                    <div className="flex flex-col gap-y-2">
                      <CollectionIconInput
                        value={value ?? null}
                        onChange={onChange}
                        hasError={!!form.formState.errors.icon}
                      />
                      <CollectionIconTip />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
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
