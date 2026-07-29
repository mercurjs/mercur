import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { ChatBubbleLeftRight, FlagMini } from "@medusajs/icons";

import { ActionMenu } from "@components/common/action-menu";
import type { ReviewDTO } from "@hooks/api/reviews";

import { StarRating, getReviewStatusProps } from "../../common/utils";

const formatDateTime = (value: string | Date) =>
  new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const ReviewGeneralSection = ({ review }: { review: ReviewDTO }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { color, label } = getReviewStatusProps(review.status, t);
  const hasResponse = Boolean(review.seller_note);

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>#{review.id}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {formatDateTime(review.created_at)}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={color}>{label}</StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <ChatBubbleLeftRight />,
                    label: t("reviews.respond.action"),
                    onClick: () => navigate("respond"),
                    disabled: hasResponse,
                    disabledTooltip: t("reviews.respond.alreadyResponded"),
                  },
                  {
                    icon: <FlagMini />,
                    label: t("reviews.report.action"),
                    onClick: () => navigate("report"),
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("reviews.fields.rating")}
        </Text>
        <StarRating rating={review.rating} />
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("reviews.fields.content")}
        </Text>
        <Text size="small" leading="compact">
          {review.customer_note || "-"}
        </Text>
      </div>

      <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("reviews.fields.response")}
        </Text>
        <Text size="small" leading="compact">
          {review.seller_note || "-"}
        </Text>
      </div>
    </Container>
  );
};
