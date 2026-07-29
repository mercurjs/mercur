import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"
import { useSellers } from "../../api/sellers"

export const useCampaignTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  const { sellers } = useSellers({ limit: 100, fields: "id,name" })

  return useMemo(() => {
    const typeFilter: Filter = {
      key: "budget_type",
      label: t("campaigns.fields.type"),
      type: "select",
      options: [
        { label: t("campaigns.budget.type.usage.title"), value: "usage" },
        { label: t("campaigns.budget.type.spend.title"), value: "spend" },
      ],
    }

    const ownerFilter: Filter = {
      key: "seller_id",
      label: t("campaigns.fields.owner"),
      type: "select",
      searchable: true,
      options: [
        { label: t("campaigns.fields.platformOwner"), value: "platform" },
        ...(sellers ?? []).map((seller) => ({
          label: seller.name!,
          value: seller.id,
        })),
      ],
    }

    const statusFilter: Filter = {
      key: "status",
      label: t("fields.status"),
      type: "select",
      options: [
        { label: t("campaigns.status.active"), value: "active" },
        { label: t("campaigns.status.expired"), value: "expired" },
        { label: t("campaigns.status.scheduled"), value: "scheduled" },
      ],
    }

    const dateFilters: Filter[] = [
      { label: t("fields.createdAt"), key: "created_at", type: "date" },
      { label: t("fields.updatedAt"), key: "updated_at", type: "date" },
    ]

    return [typeFilter, ownerFilter, statusFilter, ...dateFilters]
  }, [t, sellers])
}
