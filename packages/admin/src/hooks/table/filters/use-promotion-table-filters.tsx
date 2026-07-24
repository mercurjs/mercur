import { useTranslation } from "react-i18next"
import { useMemo } from "react"

import { Filter } from "../../../components/table/data-table"
import { useCampaigns } from "../../api/campaigns"
import { useSellers } from "../../api/sellers"

export const usePromotionTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  const { campaigns } = useCampaigns({ limit: 100, fields: "id,name" })
  const { sellers } = useSellers({ limit: 100, fields: "id,name" })

  return useMemo(() => {
    const typeFilter: Filter = {
      key: "application_method_type",
      label: t("promotions.fields.type"),
      type: "select",
      options: [
        {
          label: t("promotions.fields.typeLabels.percentageItems"),
          value: "percentage",
        },
        {
          label: t("promotions.fields.typeLabels.amountItems"),
          value: "fixed",
        },
      ],
    }

    const methodFilter: Filter = {
      key: "is_automatic",
      label: t("promotions.fields.method"),
      type: "select",
      options: [
        { label: t("promotions.form.method.code.title"), value: "false" },
        {
          label: t("promotions.form.method.automatic.title"),
          value: "true",
        },
      ],
    }

    const campaignFilter: Filter = {
      key: "campaign_id",
      label: t("promotions.fields.campaign"),
      type: "select",
      searchable: true,
      options: (campaigns ?? []).map((campaign) => ({
        label: campaign.name!,
        value: campaign.id,
      })),
    }

    const ownerFilter: Filter = {
      key: "seller_id",
      label: t("promotions.fields.owner"),
      type: "select",
      searchable: true,
      options: [
        { label: t("promotions.fields.platformOwner"), value: "platform" },
        ...(sellers ?? []).map((seller) => ({
          label: seller.name!,
          value: seller.id,
        })),
      ],
    }

    const dateFilters: Filter[] = [
      { label: t("fields.createdAt"), key: "created_at", type: "date" },
      { label: t("fields.updatedAt"), key: "updated_at", type: "date" },
    ]

    return [
      typeFilter,
      methodFilter,
      campaignFilter,
      ownerFilter,
      ...dateFilters,
    ]
  }, [t, campaigns, sellers])
}
