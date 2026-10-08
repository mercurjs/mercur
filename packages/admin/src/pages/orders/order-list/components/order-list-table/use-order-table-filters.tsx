import { usePermissions } from "@mercurjs/dashboard-shared"
import { keepPreviousData } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { Filter } from "@components/table/data-table/data-table-filter"
import { useSalesChannels } from "@hooks/api/sales-channels"
import { useCustomers } from "@hooks/api/customers"
import { useSellers } from "@hooks/api/sellers"
import { useDebouncedSearch } from "@hooks/use-debounced-search"

// Options are searched server-side, so only a page of candidates is loaded
// at a time. Entities already selected in the URL are fetched separately so
// their labels render even when they fall outside the current search.
const OPTIONS_PAGE_SIZE = 50

type Option = { label: string; value: string }

const mergeOptions = (selected: Option[], found: Option[]) => {
  const seen = new Set<string>()
  return [...selected, ...found].filter((option) => {
    if (seen.has(option.value)) {
      return false
    }
    seen.add(option.value)
    return true
  })
}

const useSelectedIds = (key: string) => {
  const [searchParams] = useSearchParams()
  const raw = searchParams.get(key)
  return useMemo(() => raw?.split(",").filter(Boolean) ?? [], [raw])
}

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

  const customerSearch = useDebouncedSearch()
  const sellerSearch = useDebouncedSearch()
  const salesChannelSearch = useDebouncedSearch()

  const selectedCustomerIds = useSelectedIds("customer_id")
  const selectedSellerIds = useSelectedIds("seller_id")
  const selectedSalesChannelIds = useSelectedIds("sales_channel_id")

  const canViewCustomers = can("customers")
  const canViewSellers = can("sellers")
  const canViewSalesChannels = can("sales_channels")

  const customerFields = "id,first_name,last_name,email"
  const { customers, isFetching: isFetchingCustomers } = useCustomers(
    {
      limit: OPTIONS_PAGE_SIZE,
      fields: customerFields,
      ...(customerSearch.query ? { q: customerSearch.query } : {}),
    },
    { enabled: canViewCustomers, placeholderData: keepPreviousData }
  )
  const { customers: selectedCustomers } = useCustomers(
    {
      id: selectedCustomerIds,
      limit: selectedCustomerIds.length,
      fields: customerFields,
    },
    { enabled: canViewCustomers && selectedCustomerIds.length > 0 }
  )

  const { sellers, isFetching: isFetchingSellers } = useSellers(
    {
      limit: OPTIONS_PAGE_SIZE,
      fields: "id,name",
      ...(sellerSearch.query ? { q: sellerSearch.query } : {}),
    },
    { enabled: canViewSellers, placeholderData: keepPreviousData }
  )
  const { sellers: selectedSellers } = useSellers(
    {
      id: selectedSellerIds,
      limit: selectedSellerIds.length,
      fields: "id,name",
    },
    { enabled: canViewSellers && selectedSellerIds.length > 0 }
  )

  const { sales_channels, isFetching: isFetchingSalesChannels } =
    useSalesChannels(
      {
        limit: OPTIONS_PAGE_SIZE,
        fields: "id,name",
        ...(salesChannelSearch.query ? { q: salesChannelSearch.query } : {}),
      },
      { enabled: canViewSalesChannels, placeholderData: keepPreviousData }
    )
  const { sales_channels: selectedSalesChannels } = useSalesChannels(
    {
      id: selectedSalesChannelIds,
      limit: selectedSalesChannelIds.length,
      fields: "id,name",
    },
    { enabled: canViewSalesChannels && selectedSalesChannelIds.length > 0 }
  )

  return useMemo(() => {
    const filters: Filter[] = []

    const customerOption = (c: {
      id: string
      first_name?: string | null
      last_name?: string | null
      email?: string | null
    }): Option => ({
      label:
        [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || c.id,
      value: c.id,
    })
    const namedOption = (s: { id: string; name?: string | null }): Option => ({
      label: s.name || s.id,
      value: s.id,
    })

    if (canViewCustomers) {
      filters.push({
        key: "customer_id",
        label: t("fields.customer"),
        type: "select",
        multiple: true,
        searchable: true,
        onSearch: customerSearch.onSearchValueChange,
        isLoading: isFetchingCustomers,
        options: mergeOptions(
          (selectedCustomers ?? []).map(customerOption),
          (customers ?? []).map(customerOption)
        ),
      })
    }

    if (canViewSellers) {
      filters.push({
        key: "seller_id",
        label: t("fields.store"),
        type: "select",
        multiple: true,
        searchable: true,
        onSearch: sellerSearch.onSearchValueChange,
        isLoading: isFetchingSellers,
        options: mergeOptions(
          (selectedSellers ?? []).map(namedOption),
          (sellers ?? []).map(namedOption)
        ),
      })
    }

    if (canViewSalesChannels) {
      filters.push({
        key: "sales_channel_id",
        label: t("fields.salesChannel"),
        type: "select",
        multiple: true,
        searchable: true,
        onSearch: salesChannelSearch.onSearchValueChange,
        isLoading: isFetchingSalesChannels,
        options: mergeOptions(
          (selectedSalesChannels ?? []).map(namedOption),
          (sales_channels ?? []).map(namedOption)
        ),
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
  }, [
    t,
    canViewCustomers,
    canViewSellers,
    canViewSalesChannels,
    customers,
    selectedCustomers,
    isFetchingCustomers,
    customerSearch.onSearchValueChange,
    sellers,
    selectedSellers,
    isFetchingSellers,
    sellerSearch.onSearchValueChange,
    sales_channels,
    selectedSalesChannels,
    isFetchingSalesChannels,
    salesChannelSearch.onSearchValueChange,
  ])
}
