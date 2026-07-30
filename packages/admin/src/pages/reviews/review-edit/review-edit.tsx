import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"

import { RouteDrawer } from "../../../components/modals"
import { VisuallyHidden } from "../../../components/utilities/visually-hidden"
import { useReview } from "../../../hooks/api/reviews"
import { EditReviewForm } from "./components/edit-review-form"

export const ReviewEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const { review, isLoading, isError, error } = useReview(id!)

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("reviews.edit.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description asChild>
          <VisuallyHidden>{t("reviews.edit.description")}</VisuallyHidden>
        </RouteDrawer.Description>
      </RouteDrawer.Header>

      {!isLoading && review && <EditReviewForm review={review} />}
    </RouteDrawer>
  )
}
