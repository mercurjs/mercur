import { useParams } from "react-router-dom";
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui";

import {
  SingleColumnPageSkeleton,
  SingleColumnPage,
} from "@mercurjs/dashboard-shared";
import { useReview, ReviewDTO } from "../../../hooks/api/reviews";

const ratingColor = (rating: number) => {
  if (rating >= 4) return "green" as const;
  if (rating >= 3) return "orange" as const;
  return "red" as const;
};

const ReviewGeneralSection = ({ review }: { review: ReviewDTO }) => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{review.id}</Heading>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={ratingColor(review.rating)}>
            {review.rating} / 5
          </StatusBadge>
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Reference
        </Text>
        <Text size="small" leading="compact">
          {review.reference.charAt(0).toUpperCase() + review.reference.slice(1)}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Customer Note
        </Text>
        <Text size="small" leading="compact">
          {review.customer_note || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Seller Note
        </Text>
        <Text size="small" leading="compact">
          {review.seller_note || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Created At
        </Text>
        <Text size="small" leading="compact">
          {new Date(review.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Updated At
        </Text>
        <Text size="small" leading="compact">
          {new Date(review.updated_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </div>
    </Container>
  );
};

export const ReviewDetailPage = () => {
  const { id } = useParams();

  const { review, isLoading, isError, error } = useReview(id!);

  if (isLoading || !review) {
    return <SingleColumnPageSkeleton sections={1} />;
  }

  if (isError) {
    throw error;
  }

  return (
    <SingleColumnPage showMetadata>
      <ReviewGeneralSection review={review} />
    </SingleColumnPage>
  );
};
