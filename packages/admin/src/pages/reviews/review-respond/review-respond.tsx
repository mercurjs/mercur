import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Navigate, useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { VisuallyHidden } from "../../../components/utilities/visually-hidden"
import { useReview } from "../../../hooks/api/reviews"
import { RespondReviewForm } from "./components/respond-review-form"

export const ReviewRespond = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { review, isLoading, isError, error } = useReview(id!)

  if (isError) {
    throw error
  }

  if (!isLoading && review?.seller_note) {
    return <Navigate to={`/reviews/${id}`} replace />
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("reviews.respond.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description asChild>
          <VisuallyHidden>{t("reviews.respond.description")}</VisuallyHidden>
        </RouteDrawer.Description>
      </RouteDrawer.Header>

      {!isLoading && review && <RespondReviewForm review={review} />}
    </RouteDrawer>
  )
}
