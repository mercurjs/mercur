import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { useCustomerAddress } from "../../../hooks/api/customers"
import { EditCustomerAddressForm } from "./components/edit-customer-address-form"

export const CustomerEditAddress = () => {
  const { t } = useTranslation()
  const { id, address_id } = useParams()

  const { address, isPending, isError, error } = useCustomerAddress(
    id!,
    address_id!
  )

  const ready = !isPending && !!address

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("customers.addresses.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("customers.addresses.edit.hint")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditCustomerAddressForm customerId={id!} address={address} />}
    </RouteDrawer>
  )
}
