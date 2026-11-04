import { Children, ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { WidgetZone } from "@mercurjs/dashboard-shared"

import { SingleColumnPage } from "../../../components/layout/pages"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import {
  useFeatureFlag,
  useFeatureFlagContext,
} from "../../../providers/feature-flag-provider"
import {
  ProductInboxDataTable,
  ProductInboxHeader,
  ProductInboxTable,
  ProductInboxTitle,
} from "./components/product-inbox-table"

const Root = ({ children }: { children?: ReactNode }) => {
  const { isLoading } = useFeatureFlagContext()
  const enabled = useFeatureFlag("product_request")

  if (isLoading) {
    return <SingleColumnPageSkeleton sections={1} showJSON={false} showMetadata={false} />
  }

  if (!enabled) {
    return <Navigate to="/products" replace />
  }

  return (
    <SingleColumnPage>
      <WidgetZone id="products.inbox">
        {Children.count(children) > 0 ? children : <ProductInboxTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ProductInboxPage = Object.assign(Root, {
  Table: ProductInboxTable,
  Header: ProductInboxHeader,
  HeaderTitle: ProductInboxTitle,
  DataTable: ProductInboxDataTable,
})

export const Component = Root
