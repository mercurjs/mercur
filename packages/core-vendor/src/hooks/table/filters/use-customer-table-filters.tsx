import { useTranslation } from "react-i18next"
import { Filter } from "../../../components/table/data-table"
import { useCustomerGroups } from "../../api/customer-groups"

const excludeableFields = ["groups"] as const

export const useCustomerTableFilters = (
  exclude?: (typeof excludeableFields)[number][]
) => {
  const { t } = useTranslation()

  const isGroupsExcluded = exclude?.includes("groups")

  const { customer_groups } = useCustomerGroups(
    {
      limit: 1000,
    },
    {
      enabled: !isGroupsExcluded,
    }
  )

  let filters: Filter[] = []

  if (customer_groups && !isGroupsExcluded) {
    const customerGroupFilter: Filter = {
      key: "groups",
      label: t("customers.groups.label"),
      type: "select",
      multiple: true,
      options: customer_groups
        .filter((s) => s.customer_group?.name)
        .map((s) => ({
          label: s.customer_group.name as string,
          value: s.customer_group.id,
        })),
    }

    filters = [...filters, customerGroupFilter]
  }

  const hasAccountFilter: Filter = {
    key: "has_account",
    label: t("fields.account"),
    type: "select",
    options: [
      {
        label: t("customers.registered"),
        value: "true",
      },
      {
        label: t("customers.guest"),
        value: "false",
      },
    ],
  }

  filters = [...filters, hasAccountFilter]

  return filters
}
