import { useTranslation } from "react-i18next"
import { Outlet, useLocation } from "react-router-dom"

import { ConfigurableDataTable } from "../../../../../components/table/configurable-data-table"
import { useProductTableAdapter } from "./product-table-adapter"

export const ConfigurableProductListTable = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const adapter = useProductTableAdapter()

  return (
    <>
      <ConfigurableDataTable
        adapter={adapter}
        heading={t("products.domain")}
        actions={[
          { label: t("actions.export"), to: `export${location.search}` },
          { label: t("actions.import"), to: `import${location.search}` },
          { label: t("actions.create"), to: "create" },
        ]}
      />
      <Outlet />
    </>
  )
}
