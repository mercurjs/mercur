import { useTranslation } from "react-i18next"
import { RouteFocusModal } from "../../../components/modals"
import { CreateOfferForm } from "./create-offer-form"

export const OfferCreatePage = () => {
  const { t } = useTranslation()

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("offers.create.header")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("offers.create.description")}</span>
      </RouteFocusModal.Description>
      <CreateOfferForm />
    </RouteFocusModal>
  )
}

export const Component = OfferCreatePage
