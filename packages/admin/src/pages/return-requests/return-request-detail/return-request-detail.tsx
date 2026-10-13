import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useOrder } from "../../../hooks/api/orders"
import { useReturnRequest } from "../../../hooks/api/return-requests"
import { returnRequestLoader } from "./loader"
import { ReturnRequestGeneralSection } from "./components/return-request-general-section"
import { ReturnRequestItemsSection } from "./components/return-request-items-section"
import {
  ReturnRequestCustomerSection,
  ReturnRequestOrderSection,
  ReturnRequestStoreSection,
} from "./components/return-request-sidebar-sections"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof returnRequestLoader>
  >

  const { id } = useParams()
  const {
    return_request: returnRequest,
    isLoading,
    isError,
    error,
  } = useReturnRequest(id!, undefined, { initialData })

  const { order } = useOrder(
    returnRequest?.order_id ?? "",
    { fields: "id,display_id,currency_code,email,*items" },
    { enabled: Boolean(returnRequest?.order_id) }
  )

  if (isLoading || !returnRequest) {
    return <TwoColumnPageSkeleton mainSections={2} sidebarSections={3} />
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage
      hasOutlet
      data={returnRequest}
      data-testid="return-request-detail-page"
    >
      <TwoColumnPage.Main>
        {Children.count(children) > 0 ? (
          children
        ) : (
          <>
            <ReturnRequestGeneralSection
              returnRequest={returnRequest}
              currencyCode={order?.currency_code}
            />
            <ReturnRequestItemsSection returnRequest={returnRequest} order={order} />
          </>
        )}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ReturnRequestCustomerSection returnRequest={returnRequest} />
        <ReturnRequestOrderSection order={order} />
        <ReturnRequestStoreSection returnRequest={returnRequest} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const ReturnRequestDetailPage = Object.assign(Root, {
  General: ReturnRequestGeneralSection,
  Items: ReturnRequestItemsSection,
  Customer: ReturnRequestCustomerSection,
  Order: ReturnRequestOrderSection,
  Store: ReturnRequestStoreSection,
})
