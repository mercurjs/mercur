import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { z } from "zod"

import { Form } from "../../../components/common/form"
import { RouteDrawer, useRouteModal } from "../../../components/modals"
import { KeyboundForm } from "../../../components/utilities/keybound-form"
import {
  useCollection,
  useUpdateCollection,
} from "../../../hooks/api/collections"
import {
  CollectionIconInput,
  CollectionIconTip,
  CollectionWithImages,
  getCollectionIcon,
  uploadCollectionImages,
} from "../common/components/collection-image-fields"

const EditCollectionIconSchema = z.object({
  icon: z
    .object({
      url: z.string(),
      file: z.any().nullable(),
    })
    .nullable(),
})

type EditCollectionIconFormProps = {
  collection: HttpTypes.AdminCollection & CollectionWithImages
}

const EditCollectionIconForm = ({
  collection,
}: EditCollectionIconFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const existingIcon = getCollectionIcon(collection.media_images)

  const form = useForm<z.infer<typeof EditCollectionIconSchema>>({
    defaultValues: {
      icon: existingIcon ? { url: existingIcon.url, file: null } : null,
    },
    resolver: zodResolver(EditCollectionIconSchema),
  })

  const { mutateAsync, isPending } = useUpdateCollection(collection.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    const images = await uploadCollectionImages({ icon: data.icon ?? null })
    await mutateAsync(images, {
      onSuccess: () => {
        toast.success(t("collections.icon.edit.successToast"))
        handleSuccess()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <Form.Field
            control={form.control}
            name="icon"
            render={({ field: { value, onChange } }) => {
              return (
                <Form.Item>
                  <Form.Label optional>
                    {t("collections.icon.label")}
                  </Form.Label>
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
              )
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

export const CollectionIconEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { collection, isLoading, isError, error } = useCollection(id!)

  const ready = !isLoading && !!collection

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("collections.icon.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("collections.icon.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditCollectionIconForm collection={collection} />}
    </RouteDrawer>
  )
}
