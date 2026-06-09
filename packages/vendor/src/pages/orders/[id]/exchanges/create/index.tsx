// Route: /orders/:id/exchanges/create
//
// Thin route entry. Mirrors admin's `/admin/orders/:id/exchanges`
// pattern (`exchange-create.tsx`). All UI lives in
// `_components/exchange-create-form/` so the route here just hosts the
// `RouteFocusModal` shell and delegates to the form.
import { useTranslation } from "react-i18next"

import { RouteFocusModal } from "@components/modals"

import { ExchangeCreateForm } from "./_components/exchange-create-form"

export const Component = () => {
  const { t } = useTranslation()

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("orders.exchanges.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description className="sr-only">
        {t("orders.exchanges.title")}
      </RouteFocusModal.Description>
      <ExchangeCreateForm />
    </RouteFocusModal>
  )
}

export default Component
