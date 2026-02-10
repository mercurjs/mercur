import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "@components/modals"
import { useProduct } from "@hooks/api/products"
import { PRODUCT_DETAIL_FIELDS } from "@pages/products/common/constants"
import { ProductShippingProfileForm } from "./product-shipping-profile-form"
import {
  ProductShippingProfileProvider,
  useProductShippingProfileContext,
} from "./product-shipping-profile-context"

function Root({ children }: { children: ReactNode }) {
  const { id } = useParams()

  const { product, isLoading, isError, error } = useProduct(id!, {
    fields: PRODUCT_DETAIL_FIELDS,
  })

  if (isError) {
    throw error
  }

  return (
    <ProductShippingProfileProvider
      value={{
        product: product! as HttpTypes.AdminProduct & {
          shipping_profile?: HttpTypes.AdminShippingProfile
        },
        isLoading,
        isError,
        error: error as Error | null,
      }}
    >
      <RouteDrawer data-testid="product-shipping-profile-drawer">
        {children}
      </RouteDrawer>
    </ProductShippingProfileProvider>
  )
}

function Header() {
  const { t } = useTranslation()

  return (
    <RouteDrawer.Header data-testid="product-shipping-profile-drawer-header">
      <RouteDrawer.Title
        asChild
        data-testid="product-shipping-profile-drawer-title"
      >
        <Heading data-testid="product-shipping-profile-drawer-title-text">
          {t("products.shippingProfile.edit.header")}
        </Heading>
      </RouteDrawer.Title>
    </RouteDrawer.Header>
  )
}

function Form() {
  const { product, isLoading } = useProductShippingProfileContext()

  if (isLoading || !product) {
    return null
  }

  return <ProductShippingProfileForm product={product} />
}

export const ProductShippingProfileDrawer = Object.assign(Root, {
  Header,
  Form,
  useContext: useProductShippingProfileContext,
})
