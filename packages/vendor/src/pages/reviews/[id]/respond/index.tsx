// Route: /reviews/:id/respond
import { useEffect } from "react";
import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteDrawer, useRouteModal } from "@components/modals";
import { VisuallyHidden } from "@components/utilities/visually-hidden";
import { useReview } from "@hooks/api/reviews";

import { RespondReviewForm } from "./respond-review-form";

export const Component = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { handleSuccess } = useRouteModal();

  const { review, isLoading, isError, error } = useReview(id!);

  useEffect(() => {
    if (review?.seller_note) {
      handleSuccess();
    }
  }, [review?.seller_note, handleSuccess]);

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("reviews.respond.header")}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description asChild>
          <VisuallyHidden>{t("reviews.respond.confirmDescription")}</VisuallyHidden>
        </RouteDrawer.Description>
      </RouteDrawer.Header>

      {!isLoading && review && !review.seller_note && (
        <RespondReviewForm reviewId={review.id} />
      )}
    </RouteDrawer>
  );
};
