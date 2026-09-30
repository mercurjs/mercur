import { Heading } from "@medusajs/ui"
import { SectionNoAccess, isForbidden, useCan } from "@mercurjs/dashboard-shared"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { useCustomerGroups } from "../../../hooks/api/customer-groups"
import { usePriceList } from "../../../hooks/api/price-lists"
import { PriceListCustomerAvailabilityForm } from "./components/price-list-customer-availability-form"

export const PriceListCustomerAvailability = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  const canViewCustomerGroups = useCan("customer_groups")

  const { price_list, isPending, isError, error } = usePriceList(id!)

  const customerGroupIds = price_list?.rules?.["customer.groups.id"] as
    | string[]
    | undefined

  const {
    customer_groups,
    isPending: isCustomerGroupsPending,
    isError: isCustomerGroupsError,
    error: customerGroupsError,
  } = useCustomerGroups(
    {
      id: customerGroupIds,
    },
    { enabled: !!customerGroupIds?.length && canViewCustomerGroups }
  )

  const customerGroupsForbidden =
    !!customerGroupIds?.length &&
    (!canViewCustomerGroups || isForbidden(customerGroupsError))

  const initialCustomerGroups =
    customer_groups?.map((group) => ({
      id: group.id,
      name: group.name!,
    })) || []

  const isCustomerGroupsReady = isPending
    ? false
    : !(!!customerGroupIds?.length && isCustomerGroupsPending)

  const ready =
    !isPending &&
    !!price_list &&
    isCustomerGroupsReady &&
    !customerGroupsForbidden

  if (isError) {
    throw error
  }

  if (isCustomerGroupsError && !customerGroupsForbidden) {
    throw customerGroupsError
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("priceLists.customerAvailability.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {customerGroupsForbidden && (
        <RouteDrawer.Body>
          <SectionNoAccess className="" />
        </RouteDrawer.Body>
      )}
      {ready && (
        <PriceListCustomerAvailabilityForm
          priceList={price_list}
          customerGroups={initialCustomerGroups}
        />
      )}
    </RouteDrawer>
  )
}
