import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "@medusajs/ui"
import { Children, ReactNode, useMemo } from "react"
import { DeepPartial, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { useRouteModal } from "../../../../../components/modals"
import { TabbedForm } from "../../../../../components/tabbed-form/tabbed-form"
import { useCreateProductCategory } from "../../../../../hooks/api/categories"
import { transformNullableFormData } from "../../../../../lib/form-helpers"
import { uploadCategoryImages } from "../../../common/components/category-image-fields"
import { CreateCategoryDetails } from "./create-category-details"
import { CreateCategoryNesting } from "./create-category-nesting"
import { CreateCategorySchema } from "./schema"

export type CreateCategorySchemaType = z.infer<typeof CreateCategorySchema>

type CreateCategoryFormProps = {
  parentCategoryId: string | null
  children?: ReactNode
  schema?: typeof CreateCategorySchema
  defaultValues?: DeepPartial<CreateCategorySchemaType>
}

export const CreateCategoryForm = ({
  parentCategoryId,
  children,
  schema,
  defaultValues: extraDefaults,
}: CreateCategoryFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<CreateCategorySchemaType>({
    defaultValues: {
      name: "",
      description: "",
      handle: "",
      status: "active",
      visibility: "public",
      rank: parentCategoryId ? 0 : null,
      parent_category_id: parentCategoryId,
      ...extraDefaults,
    } as CreateCategorySchemaType,
    resolver: zodResolver(schema ?? CreateCategorySchema),
  })

  const { mutateAsync, isPending } = useCreateProductCategory()

  const handleSubmit = form.handleSubmit(async (data) => {
    const {
      visibility,
      status,
      parent_category_id,
      rank,
      name,
      media,
      icon,
      ...rest
    } = data
    const parsedData = transformNullableFormData(rest, false)

    const images = await uploadCategoryImages({
      media: media ?? [],
      icon: icon ?? null,
    })

    await mutateAsync(
      {
        name: name,
        ...parsedData,
        parent_category_id: parent_category_id ?? undefined,
        rank: rank ?? undefined,
        is_active: status === "active",
        is_internal: visibility === "internal",
        ...images,
      },
      {
        onSuccess: ({ product_category }) => {
          toast.success(t("categories.create.successToast"))

          handleSuccess(`/categories/${product_category.id}`)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  const defaultTabs = useMemo(
    () => [
      <CreateCategoryDetails key="details" />,
      <CreateCategoryNesting key="organize" />,
    ],
    []
  )

  const hasCustomChildren = Children.count(children) > 0

  return (
    <TabbedForm
      model="category"
      zone="create"
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending}
    >
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  )
}
