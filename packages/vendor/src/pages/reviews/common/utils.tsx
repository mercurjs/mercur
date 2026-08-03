import { StarSolid } from "@medusajs/icons";

import type { ReviewDTO } from "@hooks/api/reviews";

export const getReviewStatusProps = (
  status: ReviewDTO["status"],
  t: (key: string) => string,
) => {
  switch (status) {
    case "published":
      return { color: "green" as const, label: t("reviews.status.published") };
    case "rejected":
      return { color: "red" as const, label: t("reviews.status.rejected") };
    case "pending":
    default:
      return { color: "orange" as const, label: t("reviews.status.pending") };
  }
};

export const StarRating = ({ rating }: { rating: number }) => {
  const value = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-x-0.5" aria-label={`${value} / 5`}>
      {Array.from({ length: 5 }).map((_, index) =>
        index < value ? (
          <StarSolid key={index} className="text-ui-tag-orange-icon" />
        ) : (
          <StarSolid
            key={index}
            className="text-ui-tag-orange-icon opacity-30"
          />
        ),
      )}
    </div>
  );
};
