import { Children, ReactNode } from "react"

import { OfferConditionListDataTable } from "./offer-condition-list-data-table"

export { OfferConditionListDataTable } from "./offer-condition-list-data-table"
export {
  OfferConditionListActions,
  OfferConditionListHeader,
  OfferConditionListTitle,
} from "./offer-condition-list-header"

export const OfferConditionListTable = ({
  children,
}: {
  children?: ReactNode
}) => {
  return Children.count(children) > 0 ? (
    <>{children}</>
  ) : (
    <OfferConditionListDataTable />
  )
}
