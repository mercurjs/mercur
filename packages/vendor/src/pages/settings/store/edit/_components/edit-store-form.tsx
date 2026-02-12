import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, Textarea, toast } from "@medusajs/ui"
import { useCallback } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { FileType, FileUpload } from "@components/common/file-upload"
import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateStore } from "@hooks/api/store"
import { uploadFilesQuery } from "@lib/client"
import { MediaSchema } from "@pages/products/create/constants"

type EditStoreFormProps = {
  store: HttpTypes.AdminStore
}

const EditStoreSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  description: z.string().optional(),
  media: z.array(MediaSchema).optional(),
})

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/svg+xml",
]

const SUPPORTED_FORMATS_FILE_EXTENSIONS = [
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".heic",
  ".svg",
]

export const EditStoreForm = ({ store }: EditStoreFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const storeAny = store as any

  const form = useForm<z.infer<typeof EditStoreSchema>>({
    defaultValues: {
      name: store.name ?? "",
      email: storeAny.email ?? "",
      phone: storeAny.phone ?? "",
      description: storeAny.description ?? "",
      media: [],
    },
    resolver: zodResolver(EditStoreSchema),
  })

  const { fields } = useFieldArray({
    name: "media",
    control: form.control,
    keyName: "field_id",
  })

  const { mutateAsync, isPending } = useUpdateStore(store.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    let photoUrl = storeAny.photo || ""

    try {
      if (values.media?.length) {
        const uploaded = await uploadFilesQuery(values.media)
        photoUrl = uploaded.files?.[0]?.url || photoUrl
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }

    await mutateAsync(
      {
        name: values.name,
        email: values.email,
        phone: values.phone,
        description: values.description,
        photo: photoUrl,
      } as any,
      {
        onSuccess: () => {
          toast.success(t("store.toast.update", "Store successfully updated"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const hasInvalidFiles = useCallback(
    (fileList: FileType[]) => {
      const invalidFile = fileList.find(
        (f) => !SUPPORTED_FORMATS.includes(f.file.type)
      )

      if (invalidFile) {
        form.setError("media", {
          type: "invalid_file",
          message: t("products.media.invalidFileType", {
            name: invalidFile.file.name,
            types: SUPPORTED_FORMATS_FILE_EXTENSIONS.join(", "),
          }),
        })

        return true
      }

      return false
    },
    [form, t]
  )

  const onUploaded = useCallback(
    (files: FileType[]) => {
      form.clearErrors("media")
      if (hasInvalidFiles(files)) {
        return
      }

      form.setValue("media", [{ ...files[0], isThumbnail: false }])
    },
    [form, hasInvalidFiles]
  )

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
        <RouteDrawer.Body className="overflow-y-auto">
          <div className="flex flex-col gap-y-8">
            <Form.Field
              name="media"
              control={form.control}
              render={() => (
                <Form.Item>
                  <div className="flex flex-col gap-y-2">
                    <div className="flex flex-col gap-y-1">
                      <Form.Label>{t("store.logo", "Logo")}</Form.Label>
                    </div>
                    <Form.Control>
                      <FileUpload
                        uploadedImage={fields[0]?.url || storeAny.photo || ""}
                        multiple={false}
                        label={t("products.media.uploadImagesLabel")}
                        hint={t("products.media.uploadImagesHint")}
                        hasError={!!form.formState.errors.media}
                        formats={SUPPORTED_FORMATS}
                        onUploaded={onUploaded}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </div>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.name")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.email")}</Form.Label>
                  <Form.Control>
                    <Input type="email" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="phone"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.phone")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.description")}</Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" isLoading={isPending} type="submit">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
