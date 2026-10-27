import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useProductCategory } from "../../../hooks/api/categories"
import { CategoryWithShippingProfile } from "../category-detail/components/category-shipping-section"
import { CategoryShippingProfileForm } from "./components/category-shipping-profile-form"

export const CategoryShippingProfile = () => {
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
    <RouteDrawer data-testid="category-shipping-profile-drawer">
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading data-testid="category-shipping-profile-drawer-title">
            {t("categories.shippingProfile.edit.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("categories.shippingProfile.edit.description")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && (
        <CategoryShippingProfileForm
          category={product_category as CategoryWithShippingProfile}
        />
      )}
    </RouteDrawer>
  )
}
