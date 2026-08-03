import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Badge, Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { BadgeListSummary } from "../../../../../components/common/badge-list-summary"
import { NoRecords } from "../../../../../components/common/empty-table-content"
import { Skeleton } from "../../../../../components/common/skeleton"
import { useCustomerGroups } from "../../../../../hooks/api/customer-groups"

type PriceListCustomerAvailabilitySectionProps = {
  priceList: HttpTypes.AdminPriceList
}

export const PriceListCustomerAvailabilitySection = ({
  priceList,
}: PriceListCustomerAvailabilitySectionProps) => {
  const { t } = useTranslation()

  const customerGroupIds = priceList.rules?.["customer.groups.id"] as
    | string[]
    | undefined

  const { customer_groups, isPending, isError } = useCustomerGroups(
    { id: customerGroupIds },
    { enabled: !!customerGroupIds?.length }
  )

  const isEmpty = !customerGroupIds?.length || isError

  return (
    <Container className="p-0" data-testid="price-list-customer-availability-section-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="price-list-customer-availability-section-header">
        <Heading level="h2" data-testid="price-list-customer-availability-section-heading">
          {t("priceLists.customerAvailability.header")}
        </Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "customer-availability",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
          data-testid="price-list-customer-availability-section-action-menu"
        />
      </div>

      <div className="text-ui-fg-subtle flex flex-col gap-2 px-6 pb-4 pt-2" data-testid="price-list-customer-availability-section-content">
        {isEmpty ? (
          <NoRecords
            className="h-[180px]"
            icon={null}
            title={t("priceLists.customerAvailability.list.noRecordsTitle")}
            message={t("priceLists.customerAvailability.list.noRecordsMessage")}
            action={{
              to: "customer-availability",
              label: t("priceLists.customerAvailability.add"),
            }}
            dataTestId="price-list-customer-availability-section-add-button"
          />
        ) : isPending || !customer_groups ? (
          <Skeleton className="h-5 w-full max-w-48" />
        ) : (
          <div className="bg-ui-bg-subtle shadow-borders-base align-center flex justify-around rounded-md p-2">
            <div className="text-ui-fg-subtle txt-compact-xsmall flex items-center whitespace-nowrap">
              <Badge
                size="2xsmall"
                className="txt-compact-xsmall-plus tag-neutral-text mx-1 inline-block truncate"
              >
                {t("priceLists.fields.customerAvailability.attribute")}
              </Badge>
              <span className="txt-compact-2xsmall mx-1 inline-block">
                {t("operators.in")}
              </span>
              <BadgeListSummary
                inline
                className="!txt-compact-small-plus"
                list={customer_groups.map((group) => group.name!)}
              />
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
