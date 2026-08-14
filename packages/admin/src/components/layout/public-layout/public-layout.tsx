import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { RouteDocumentHead } from "@mercurjs/dashboard-shared"

export const PublicLayout = () => {
  const { t } = useTranslation()

  return (
    <>
      <RouteDocumentHead
        appName={t("app.html.title")}
        description={t("app.html.description")}
      />
      <Outlet />
    </>
  )
}
