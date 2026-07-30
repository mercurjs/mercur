import { Children, ReactNode } from "react"
import { useLoaderData, useParams } from "react-router-dom"

import { TwoColumnPageSkeleton } from "../../../components/common/skeleton"
import { TwoColumnPage } from "../../../components/layout/pages"
import { useReview } from "../../../hooks/api/reviews"
import { REVIEW_DETAIL_FIELDS } from "./constants"
import { reviewLoader } from "./loader"
import { ReviewGeneralSection } from "./components/review-general-section"
import {
  ReviewCustomerSection,
  ReviewOrderSection,
  ReviewStoreSection,
} from "./components/review-sidebar-sections"

const Root = ({ children }: { children?: ReactNode }) => {
  const initialData = useLoaderData() as Awaited<ReturnType<typeof reviewLoader>>

  const { id } = useParams()
  const { review, isLoading, isError, error } = useReview(
    id!,
    { fields: REVIEW_DETAIL_FIELDS },
    { initialData }
  )

  if (isLoading || !review) {
    return <TwoColumnPageSkeleton mainSections={1} sidebarSections={3} />
  }

  if (isError) {
    throw error
  }

  return (
    <TwoColumnPage hasOutlet data={review} data-testid="review-detail-page">
      <TwoColumnPage.Main>
        {Children.count(children) > 0 ? (
          children
        ) : (
          <ReviewGeneralSection review={review} />
        )}
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        <ReviewCustomerSection review={review} />
        <ReviewOrderSection review={review} />
        <ReviewStoreSection review={review} />
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  )
}

export const ReviewDetailPage = Object.assign(Root, {
  General: ReviewGeneralSection,
  Customer: ReviewCustomerSection,
  Order: ReviewOrderSection,
  Store: ReviewStoreSection,
})
