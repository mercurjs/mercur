import { Avatar, Copy, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { HttpTypes } from "@medusajs/types"
import { getFormattedAddress, isSameAddress } from "../../../lib/addresses"

const ID = ({ data }: { data: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  const id = data.customer_id
  const name = getOrderCustomer(data)
  const email = data.email
  const fallback = (name || email || "").charAt(0).toUpperCase()

  return (
    <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="order-customer-id">
      <Text size="small" leading="compact" weight="plus" data-testid="order-customer-id-label">
        {t("fields.id")}
      </Text>
      <Link
        to={`/customers/${id}`}
        className="focus:shadow-borders-focus rounded-[4px] outline-none transition-shadow"
        data-testid="order-customer-id-link"
      >
        <div className="flex items-center gap-x-2 overflow-hidden" data-testid="order-customer-id-content">
          <Avatar size="2xsmall" fallback={fallback} data-testid="order-customer-id-avatar" />
          <Text
            size="small"
            leading="compact"
            className="text-ui-fg-subtle hover:text-ui-fg-base transition-fg truncate"
            data-testid="order-customer-id-name"
          >
            {name || email}
          </Text>
        </div>
      </Link>
    </div>
  )
}

const Company = ({ data }: { data: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()
  const company =
    data.shipping_address?.company || data.billing_address?.company

  if (!company) {
    return null
  }

  return (
    <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="order-customer-company">
      <Text size="small" leading="compact" weight="plus" data-testid="order-customer-company-label">
        {t("fields.company")}
      </Text>
      <Text size="small" leading="compact" className="truncate" data-testid="order-customer-company-value">
        {company}
      </Text>
    </div>
  )
}

const Contact = ({ data }: { data: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  const phone = data.shipping_address?.phone || data.billing_address?.phone
  const email = data.email || ""

  return (
    <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4" data-testid="order-customer-contact">
      <Text size="small" leading="compact" weight="plus" data-testid="order-customer-contact-label">
        {t("orders.customer.contactLabel")}
      </Text>
      <div className="flex flex-col gap-y-2" data-testid="order-customer-contact-info">
        <div className="grid grid-cols-[1fr_20px] items-start gap-x-2" data-testid="order-customer-contact-email">
          <Text
            size="small"
            leading="compact"
            className="text-pretty break-all"
            data-testid="order-customer-contact-email-value"
          >
            {email}
          </Text>

          <div className="flex justify-end">
            <Copy content={email} className="text-ui-fg-muted" data-testid="order-customer-contact-email-copy" />
          </div>
        </div>
        {phone && (
          <div className="grid grid-cols-[1fr_20px] items-start gap-x-2" data-testid="order-customer-contact-phone">
            <Text
              size="small"
              leading="compact"
              className="text-pretty break-all"
              data-testid="order-customer-contact-phone-value"
            >
              {phone}
            </Text>

            <div className="flex justify-end">
              <Copy content={phone} className="text-ui-fg-muted" data-testid="order-customer-contact-phone-copy" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const AddressPrint = ({
  address,
  type,
}: {
  address:
    | HttpTypes.AdminOrder["shipping_address"]
    | HttpTypes.AdminOrder["billing_address"]
  type: "shipping" | "billing"
}) => {
  const { t } = useTranslation()

  return (
    <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4" data-testid={`order-customer-address-${type}`}>
      <Text size="small" leading="compact" weight="plus" data-testid={`order-customer-address-${type}-label`}>
        {type === "shipping"
          ? t("addresses.shippingAddress.label")
          : t("addresses.billingAddress.label")}
      </Text>
      {address ? (
        <div className="grid grid-cols-[1fr_20px] items-start gap-x-2" data-testid={`order-customer-address-${type}-content`}>
          <Text size="small" leading="compact" data-testid={`order-customer-address-${type}-value`}>
            {getFormattedAddress({ address }).map((line, i) => {
              return (
                <span key={i} className="break-words">
                  {line}
                  <br />
                </span>
              )
            })}
          </Text>
          <div className="flex justify-end">
            <Copy
              content={getFormattedAddress({ address }).join("\n")}
              className="text-ui-fg-muted"
              data-testid={`order-customer-address-${type}-copy`}
            />
          </div>
        </div>
      ) : (
        <Text size="small" leading="compact" data-testid={`order-customer-address-${type}-empty`}>
          -
        </Text>
      )}
    </div>
  )
}

const Addresses = ({ data }: { data: HttpTypes.AdminOrder }) => {
  const { t } = useTranslation()

  return (
    <div className="divide-y">
      <AddressPrint address={data.shipping_address} type="shipping" />
      {!isSameAddress(data.shipping_address, data.billing_address) ? (
        <AddressPrint address={data.billing_address} type="billing" />
      ) : (
        <div className="grid grid-cols-2 items-center px-6 py-4" data-testid="order-customer-address-billing-same">
          <Text
            size="small"
            leading="compact"
            weight="plus"
            className="text-ui-fg-subtle"
            data-testid="order-customer-address-billing-same-label"
          >
            {t("addresses.billingAddress.label")}
          </Text>
          <Text size="small" leading="compact" className="text-ui-fg-muted" data-testid="order-customer-address-billing-same-value">
            {t("addresses.billingAddress.sameAsShipping")}
          </Text>
        </div>
      )}
    </div>
  )
}

export const CustomerInfo = Object.assign(
  {},
  {
    ID,
    Company,
    Contact,
    Addresses,
  }
)

const getOrderCustomer = (obj: HttpTypes.AdminOrder) => {
  const { first_name: sFirstName, last_name: sLastName } =
    obj.shipping_address || {}
  const { first_name: bFirstName, last_name: bLastName } =
    obj.billing_address || {}
  const { first_name: cFirstName, last_name: cLastName } = obj.customer || {}

  const customerName = [cFirstName, cLastName].filter(Boolean).join(" ")
  const shippingName = [sFirstName, sLastName].filter(Boolean).join(" ")
  const billingName = [bFirstName, bLastName].filter(Boolean).join(" ")

  const name = customerName || shippingName || billingName

  return name
}
