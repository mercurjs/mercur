import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, toast } from "@medusajs/ui"
import { useFieldArray, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { z } from "zod"

import { RouteDrawer } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import {
  useAddProductAttribute,
  useProduct,
  useProductAttributes,
} from "@hooks/api/products"
import { UserCreatedOptionsList } from "../create/product-create-attributes-form/user-created-options-list"
import { ProductCreateOptionSchema } from "../create/constants"
import { ProductCreateSchemaType } from "../create/types"

export const ProductAddAttribute = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const form = useForm<ProductCreateSchemaType>({
    defaultValues: {
      options: [
        {
          title: "",
          values: [],
          metadata: { author: "vendor" },
          attributeId: "",
          useForVariants: true,
        },
      ],
    },
    resolver: zodResolver(
      z.object({
        options: z.array(ProductCreateOptionSchema),
      })
    ),
  })

  const { attributes: allAttributes, isLoading: allAttributesLoading } =
    useProductAttributes(id!)
  const { product, isLoading: isProductLoading } = useProduct(id!)

  const nonRequiredAttributes = allAttributes
    ?.filter((attribute: any) => !attribute.is_required)

  const availableAttributes = nonRequiredAttributes
    ?.filter(
      (attribute: any) =>
        !product?.informational_attributes?.some(
          (infoAttribute: any) =>
            infoAttribute.attribute_id === attribute.id
        )
    )

  const options = useFieldArray({
    control: form.control,
    name: "options",
  })

  const { mutateAsync, isPending } = useAddProductAttribute(id!)

  const handleSubmit = form.handleSubmit(async (data) => {
    const option = data.options?.[0]

    const name = option?.title?.trim()
    const values = (option?.values ?? [])
      .map((v) => v.trim())
      .filter(Boolean)
    const use_for_variations = option?.useForVariants === true
    const selectedAttribute = availableAttributes?.find(
      (attr: any) => attr.id === option?.attributeId
    )
    const ui_component =
      selectedAttribute?.ui_component ?? "multivalue"

    await mutateAsync(
      {
        name,
        values,
        use_for_variations,
        ui_component,
        attribute_id: option?.attributeId || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("actions.save"))
          navigate(`/products/${id}`, {
            replace: true,
            state: { isSubmitSuccessful: true },
          })
        },
        onError: (err) => {
          toast.error(err.message)
        },
      }
    )
  })

  if (allAttributesLoading || isProductLoading) {
    return null
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <div className="flex items-center justify-between">
          <RouteDrawer.Title asChild>
            <Heading>
              {t("products.edit.attributes.addAttribute")}
            </Heading>
          </RouteDrawer.Title>
        </div>
      </RouteDrawer.Header>
      <RouteDrawer.Form form={form}>
        <KeyboundForm
          onSubmit={handleSubmit}
          className="flex h-full flex-col"
        >
          <RouteDrawer.Body className="flex flex-col gap-y-4">
            <UserCreatedOptionsList
              form={form}
              options={options}
              allowRemove={false}
              availableAttributes={availableAttributes ?? []}
              allNonRequiredAttributes={nonRequiredAttributes ?? []}
              isExistingProduct
              allowCreate
            />
          </RouteDrawer.Body>
          <RouteDrawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteDrawer.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  disabled={isPending}
                >
                  {t("actions.cancel")}
                </Button>
              </RouteDrawer.Close>
              <Button
                size="small"
                type="submit"
                isLoading={isPending}
              >
                {t("actions.create")}
              </Button>
            </div>
          </RouteDrawer.Footer>
        </KeyboundForm>
      </RouteDrawer.Form>
    </RouteDrawer>
  )
}
