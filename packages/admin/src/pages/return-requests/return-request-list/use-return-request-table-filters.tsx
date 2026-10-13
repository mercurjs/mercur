import { useMemo } from "react"
import { usePermissions } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"
import { useSellers } from "../../../hooks/api/sellers"
import { RETURN_REQUEST_STATUSES } from "../common/utils"

export const useReturnRequestTableFilters = (): Filter[] => {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canViewSellers = can("sellers")

  const { sellers } = useSellers(
    { limit: 100 },
    { enabled: canViewSellers }
  )

  return useMemo(() => {
    const statusFilter: Filter = {
      key: "status",
      label: t("returnRequests.fields.status"),
      type: "select",
      multiple: true,
      options: RETURN_REQUEST_STATUSES.map((status) => ({
        label: t(`returnRequests.status.${status}`),
        value: status,
      })),
    }

    const sellerFilter: Filter = {
      key: "seller_id",
      label: t("returnRequests.fields.store"),
      type: "select",
      multiple: true,
      options: (sellers ?? []).map((seller) => ({
        label: seller.name,
        value: seller.id,
      })),
    }

    const createdFilter: Filter = {
      key: "created_at",
      label: t("fields.createdAt"),
      type: "date",
    }

    return [statusFilter, ...(canViewSellers ? [sellerFilter] : []), createdFilter]
  }, [t, sellers, canViewSellers])
}
