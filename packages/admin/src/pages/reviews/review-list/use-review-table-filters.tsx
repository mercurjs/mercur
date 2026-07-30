import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Filter } from "../../../components/table/data-table"
import { useCustomers } from "../../../hooks/api/customers"
import { useSellers } from "../../../hooks/api/sellers"

export const useReviewTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  const { sellers } = useSellers({ limit: 100, fields: "id,name" })
  const { customers } = useCustomers({
    limit: 100,
    fields: "id,first_name,last_name,email",
  })

  return useMemo(() => {
    const ratingFilter: Filter = {
      key: "rating",
      label: t("reviews.fields.rating"),
      type: "select",
      multiple: true,
      options: [1, 2, 3, 4, 5].map((value) => ({
        label: t("reviews.filters.stars", { count: value }),
        value: String(value),
      })),
    }

    const storeFilter: Filter = {
      key: "seller_id",
      label: t("reviews.fields.store"),
      type: "select",
      searchable: true,
      options: (sellers ?? []).map((seller) => ({
        label: seller.name!,
        value: seller.id,
      })),
    }

    const customerFilter: Filter = {
      key: "customer_id",
      label: t("reviews.fields.customer"),
      type: "select",
      searchable: true,
      options: (customers ?? []).map((customer) => ({
        label:
          [customer.first_name, customer.last_name]
            .filter(Boolean)
            .join(" ") ||
          customer.email ||
          customer.id,
        value: customer.id,
      })),
    }

    const createdFilter: Filter = {
      key: "created_at",
      label: t("fields.createdAt"),
      type: "date",
    }

    const statusFilter: Filter = {
      key: "status",
      label: t("reviews.fields.status"),
      type: "select",
      multiple: true,
      options: (["pending", "published", "rejected"] as const).map(
        (value) => ({
          label: t(`reviews.status.${value}`),
          value,
        })
      ),
    }

    return [
      ratingFilter,
      storeFilter,
      customerFilter,
      createdFilter,
      statusFilter,
    ]
  }, [t, sellers, customers])
}
