import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Filter } from "@components/table/data-table/data-table-filter"
import { useSalesChannels } from "@hooks/api/sales-channels"
import { useCustomers } from "@hooks/api/customers"
import { useSellers } from "@hooks/api/sellers"

export const useOrderGroupTableFilters = () => {
  const { t } = useTranslation()

  const { customers } = useCustomers({
    limit: 1000,
    fields: "id,first_name,last_name,email",
  })

  const { sellers } = useSellers({
    limit: 1000,
    fields: "id,name",
  })

  const { sales_channels } = useSalesChannels({
    limit: 1000,
    fields: "id,name",
  })

  return useMemo(() => {
    const filters: Filter[] = []

    if (customers?.length) {
      filters.push({
        key: "customer_id",
        label: t("fields.customer"),
        type: "select",
        multiple: true,
        searchable: true,
        options: customers.map((c) => ({
          label:
            [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email,
          value: c.id,
        })),
      })
    }

    if (sellers?.length) {
      filters.push({
        key: "seller_id",
        label: "Seller",
        type: "select",
        multiple: true,
        searchable: true,
        options: sellers.map((s: any) => ({
          label: s.name,
          value: s.id,
        })),
      })
    }

    if (sales_channels?.length) {
      filters.push({
        key: "sales_channel_id",
        label: t("fields.salesChannel"),
        type: "select",
        multiple: true,
        searchable: true,
        options: sales_channels.map((s) => ({
          label: s.name,
          value: s.id,
        })),
      })
    }

    filters.push({
      key: "status",
      label: t("fields.status"),
      type: "select",
      multiple: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Completed", value: "completed" },
        { label: "Canceled", value: "canceled" },
        { label: "Requires action", value: "requires_action" },
      ],
    })

    filters.push(
      {
        key: "created_at",
        label: t("fields.createdAt"),
        type: "date",
      },
      {
        key: "updated_at",
        label: t("fields.updatedAt"),
        type: "date",
      }
    )

    return filters
  }, [customers, sellers, sales_channels, t])
}
