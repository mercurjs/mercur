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
import { useProductCategory, useUpdateProductCategory } from "../../../hooks/api/categories"
import {
  CategoryMediaInput,
  CategoryWithImages,
  getCategoryGallery,
  uploadCategoryImages,
} from "../common/components/category-image-fields"
import { CategoryMediaSchema } from "../category-create/components/create-category-form/schema"

const EditCategoryMediaSchema = z.object({
  media: z.array(CategoryMediaSchema),
})

type EditCategoryMediaFormProps = {
  category: HttpTypes.AdminProductCategory & CategoryWithImages
}

const EditCategoryMediaForm = ({ category }: EditCategoryMediaFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof EditCategoryMediaSchema>>({
    defaultValues: {
      media: getCategoryGallery(category.images).map((image) => ({
        url: image.url,
        file: null,
        is_thumbnail: image.is_thumbnail,
        is_banner: image.is_banner,
        field_id: image.id,
      })),
    },
    resolver: zodResolver(EditCategoryMediaSchema),
  })

  const { mutateAsync, isPending } = useUpdateProductCategory(category.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    const images = await uploadCategoryImages({ media: data.media })
    await mutateAsync(images, {
      onSuccess: () => {
        toast.success(t("categories.media.edit.successToast"))
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
            name="media"
            render={({ field: { value, onChange } }) => {
              return (
                <Form.Item>
                  <Form.Label optional>{t("categories.media.label")}</Form.Label>
                  <Form.Control>
                    <CategoryMediaInput
                      value={value ?? []}
                      onChange={onChange}
                      hasError={!!form.formState.errors.media}
                    />
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

export const CategoryMediaEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { product_category, isPending, isError, error } = useProductCategory(
    id!
  )

  const ready = !isPending && !!product_category

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("categories.media.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("categories.media.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditCategoryMediaForm category={product_category} />}
    </RouteDrawer>
  )
}
