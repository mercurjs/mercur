import { usePermissions } from "@mercurjs/dashboard-shared"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Filter } from "@components/table/data-table/data-table-filter"
import { useSalesChannels } from "@hooks/api/sales-channels"
import { useCustomers } from "@hooks/api/customers"
import { useSellers } from "@hooks/api/sellers"

const PAYMENT_STATUSES = [
  "not_paid",
  "awaiting",
  "authorized",
  "partially_authorized",
  "captured",
  "partially_captured",
  "refunded",
  "partially_refunded",
  "canceled",
  "requires_action",
] as const

const camelCase = (value: string) =>
  value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())

export const useOrderGroupTableFilters = () => {
  const { t } = useTranslation()
  const { can } = usePermissions()

  const { customers } = useCustomers(
    {
      limit: 1000,
      fields: "id,first_name,last_name,email",
    },
    { enabled: can("customers") }
  )

  const { sellers } = useSellers(
    {
      limit: 1000,
      fields: "id,name",
    },
    { enabled: can("sellers") }
  )

  const { sales_channels } = useSalesChannels(
    {
      limit: 1000,
      fields: "id,name",
    },
    { enabled: can("sales_channels") }
  )

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
        label: t("fields.store"),
        type: "select",
        multiple: true,
        searchable: true,
        options: sellers.map((s) => ({
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

    filters.push(
      {
        key: "payment_status",
        label: t("orders.payment.statusLabel"),
        type: "select",
        multiple: true,
        options: PAYMENT_STATUSES.map((status) => ({
          label: t(`orders.payment.status.${camelCase(status)}`),
          value: status,
        })),
      },
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
