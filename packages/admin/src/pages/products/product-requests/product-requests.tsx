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
  ProductRequestsDataTable,
  ProductRequestsHeader,
  ProductRequestsTable,
  ProductRequestsTitle,
} from "./components/product-requests-table"

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
      <WidgetZone id="products.requests">
        {Children.count(children) > 0 ? children : <ProductRequestsTable />}
      </WidgetZone>
    </SingleColumnPage>
  )
}

export const ProductRequestsPage = Object.assign(Root, {
  Table: ProductRequestsTable,
  Header: ProductRequestsHeader,
  HeaderTitle: ProductRequestsTitle,
  DataTable: ProductRequestsDataTable,
})

export const Component = Root
