import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { ListSummary } from "../../../../../components/common/list-summary"
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

  return (
    <Container className="flex flex-col gap-y-4" data-testid="price-list-customer-availability-section-container">
      <div className="flex items-center justify-between" data-testid="price-list-customer-availability-section-header">
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

      {!customerGroupIds?.length || isError ? (
        <Text size="small" className="text-ui-fg-subtle" data-testid="price-list-customer-availability-section-empty">
          {"-"}
        </Text>
      ) : isPending || !customer_groups ? (
        <Skeleton className="h-5 w-full max-w-48" />
      ) : (
        <div className="txt-small-plus text-ui-fg-muted flex items-center gap-x-1.5">
          <span className="text-ui-fg-subtle">
            {t("priceLists.fields.customerAvailability.attribute")}
          </span>
          <span>·</span>
          <span>{t("operators.in")}</span>
          <span>·</span>
          <ListSummary
            list={customer_groups.map((group) => group.name!)}
            n={2}
            className="txt-small-plus text-ui-fg-muted"
          />
        </div>
      )}
    </Container>
  )
}
