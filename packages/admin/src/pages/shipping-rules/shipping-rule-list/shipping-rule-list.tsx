import { WidgetZone } from "@mercurjs/dashboard-shared"
import { Children, ReactNode } from "react"

import { SingleColumnPage } from "../../../components/layout/pages"
import {
  ShippingRuleListTitle,
  ShippingRuleListView,
} from "./components/shipping-rule-list-view"
import { ShippingRuleMatrix } from "./components/shipping-rule-matrix"

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <SingleColumnPage>
      <WidgetZone id="shipping-rules.list">
        {Children.count(children) > 0 ? children : <ShippingRuleListView />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ShippingRuleListPage = Object.assign(Root, {
  View: ShippingRuleListView,
  HeaderTitle: ShippingRuleListTitle,
  Matrix: ShippingRuleMatrix,
})
