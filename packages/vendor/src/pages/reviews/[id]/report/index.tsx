// Route: /reviews/:id/report
import { useParams } from "react-router-dom";

import { RouteFocusModal } from "@components/modals";
import { useReview } from "@hooks/api/reviews";

import { ReportReviewForm } from "./report-review-form";

export const Component = () => {
  const { id } = useParams();
  const { review, isLoading, isError, error } = useReview(id!);

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal>
      {!isLoading && review && <ReportReviewForm reviewId={review.id} />}
    </RouteFocusModal>
  );
};
