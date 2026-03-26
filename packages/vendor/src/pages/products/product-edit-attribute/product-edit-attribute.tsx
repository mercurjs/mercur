import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { json, useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct, useProductAttributes } from "@hooks/api/products"
import { EditProductAttributeForm } from "./components/edit-product-attribute-form"

export const ProductEditAttribute = () => {
  const { id, attribute_id } = useParams()
  const { t } = useTranslation()

  const { product, isPending, isFetching, isError, error } =
    useProduct(id!)

  const { attributes } = useProductAttributes(id!)

  const attribute = (product as any)?.informational_attributes?.find(
    (a: any) => a.attribute_id === attribute_id
  )

  const attributeDefinition = attributes?.find(
    (a: any) => a.id === attribute_id
  )

  if (!isPending && !isFetching && !attribute) {
    throw json(
      {
        message: `An attribute with ID ${attribute_id} was not found`,
      },
      404
    )
  }

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>
          {t("products.edit.attributes.editHeader")}
        </Heading>
      </RouteDrawer.Header>
      {attribute && (
        <EditProductAttributeForm
          productId={id!}
          attribute={attribute}
          attributeDefinition={attributeDefinition}
        />
      )}
    </RouteDrawer>
  )
}
