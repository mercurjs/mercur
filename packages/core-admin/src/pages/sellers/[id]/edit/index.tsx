// Route: /sellers/:id/edit
// Seller edit drawer page

import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"

import type { VendorSeller } from "@custom-types/seller"

import { RouteDrawer } from "@components/modals"

import { useSeller } from "@hooks/api/sellers"

import { SellerDetailPage } from "../_components"
import { SellerEditForm } from "./_components/seller-edit-form"

export const Component = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  const { data, isLoading } = useSeller(id!)

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <SellerDetailPage>
        <SellerDetailPage.GeneralSection />
        <SellerDetailPage.OrdersSection />
        <SellerDetailPage.ProductsSection />
        <SellerDetailPage.CustomerGroupsSection />
      </SellerDetailPage>
      <RouteDrawer>
        <RouteDrawer.Header>
          <RouteDrawer.Title>{t("sellers.edit.header")}</RouteDrawer.Title>
        </RouteDrawer.Header>
        {data?.seller && (
          <SellerEditForm seller={data?.seller as unknown as VendorSeller} />
        )}
      </RouteDrawer>
    </>
  )
}
