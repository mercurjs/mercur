import { Heading } from "@medusajs/ui"
import { RouteDrawer } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { useOfferCondition } from "../../../hooks/api/offer-conditions"
import { OfferConditionEditForm } from "./components/offer-condition-edit-form"

export const OfferConditionEdit = () => {
  const { id } = useParams()
  const { t } = useTranslation()

  const { offer_condition, isPending, isError, error } = useOfferCondition(id!)

  const ready = !isPending && !!offer_condition

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="offer-condition-edit-drawer">
      <RouteDrawer.Header data-testid="offer-condition-edit-drawer-header">
        <RouteDrawer.Title asChild>
          <Heading data-testid="offer-condition-edit-drawer-heading">
            {t("offerConditions.edit.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("offerConditions.edit.subtitle")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <OfferConditionEditForm offerCondition={offer_condition} />}
    </RouteDrawer>
  )
}
