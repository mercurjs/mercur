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
  CategoryIconInput,
  CategoryIconTip,
  CategoryWithImages,
  getCategoryIcon,
  uploadCategoryImages,
} from "../common/components/category-image-fields"
import { CategoryIconSchema } from "../category-create/components/create-category-form/schema"

const EditCategoryIconSchema = z.object({
  icon: CategoryIconSchema.nullable(),
})

type EditCategoryIconFormProps = {
  category: HttpTypes.AdminProductCategory & CategoryWithImages
}

const EditCategoryIconForm = ({ category }: EditCategoryIconFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const existingIcon = getCategoryIcon(category.media_images)

  const form = useForm<z.infer<typeof EditCategoryIconSchema>>({
    defaultValues: {
      icon: existingIcon ? { url: existingIcon.url, file: null } : null,
    },
    resolver: zodResolver(EditCategoryIconSchema),
  })

  const { mutateAsync, isPending } = useUpdateProductCategory(category.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    const images = await uploadCategoryImages({ icon: data.icon ?? null })
    await mutateAsync(images, {
      onSuccess: () => {
        toast.success(t("categories.icon.edit.successToast"))
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
                  <Form.Label optional>{t("categories.icon.label")}</Form.Label>
                  <Form.Control>
                    <div className="flex flex-col gap-y-2">
                      <CategoryIconInput
                        value={value ?? null}
                        onChange={onChange}
                        hasError={!!form.formState.errors.icon}
                      />
                      <CategoryIconTip />
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

export const CategoryIconEdit = () => {
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
          <Heading>{t("categories.icon.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("categories.icon.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditCategoryIconForm category={product_category} />}
    </RouteDrawer>
  )
}
