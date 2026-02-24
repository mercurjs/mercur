import { useTranslation } from "react-i18next"
import { ConfigurableDataTable } from "../../../../../components/table/configurable-data-table"
import { useOrderTableAdapter } from "./order-table-adapter"

export const ConfigurableOrderListTable = () => {
  const { t } = useTranslation()
  const orderAdapter = useOrderTableAdapter()

  return (
    <ConfigurableDataTable
      adapter={orderAdapter}
      heading={t("orders.domain")}
      layout="fill"
      data-testid="orders-configurable-table"
    />
  )
}
