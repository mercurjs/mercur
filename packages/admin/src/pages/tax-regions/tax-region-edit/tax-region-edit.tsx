import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { TaxRegionEditForm } from "./components/tax-region-edit"
import { useTaxRegion } from "../../../hooks/api"

export const TaxRegionEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  const { tax_region, isPending, isError, error } = useTaxRegion(id!)

  const ready = !isPending && !!tax_region

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="tax-region-edit-drawer">
      <RouteDrawer.Header data-testid="tax-region-edit-drawer-header">
        <RouteDrawer.Title asChild>
          <Heading data-testid="tax-region-edit-drawer-heading">{t("taxRegions.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("taxRegions.edit.hint")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <TaxRegionEditForm taxRegion={tax_region} />}
    </RouteDrawer>
  )
}
