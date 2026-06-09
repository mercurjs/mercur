import { ProductAttributeDTO } from "@mercurjs/types"
import { createDataTableFilterHelper } from "@medusajs/ui"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useDataTableDateFilters } from "@components/data-table/helpers/general/use-data-table-date-filters"

const filterHelper = createDataTableFilterHelper<ProductAttributeDTO>()

export const useAttributeTableFilters = () => {
  const { t } = useTranslation()
  const dateFilters = useDataTableDateFilters()

  return useMemo(
    () => [
      filterHelper.accessor("is_filterable", {
        label: t("attributes.fields.filterable"),
        type: "select",
        options: [
          { label: t("filters.radio.yes"), value: "true" },
          { label: t("filters.radio.no"), value: "false" },
        ],
      }),
      ...dateFilters,
    ],
    [t, dateFilters]
  )
}
