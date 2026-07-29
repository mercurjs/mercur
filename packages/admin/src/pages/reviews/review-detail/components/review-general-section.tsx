import { ChatBubbleLeftRight, PencilSquare, Trash } from "@medusajs/icons"
import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "../../../../components/common/action-menu"
import { AdminReview } from "../../../../hooks/api/reviews"
import { useDeleteReviewAction } from "../../common/hooks/use-delete-review-action"
import { getReviewStatusColor, StarRating } from "../../common/utils"

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="text-ui-fg-subtle grid grid-cols-2 items-start px-6 py-4">
    <Text size="small" leading="compact" weight="plus">
      {label}
    </Text>
    <div className="text-ui-fg-subtle">{children}</div>
  </div>
)

export const ReviewGeneralSection = ({ review }: { review: AdminReview }) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteReviewAction(review.id, true)

  const hasResponse = Boolean(review.seller_note)

  const createdAt = new Date(review.created_at).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Container className="divide-y p-0" data-testid="review-general-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>#{review.display_id}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {createdAt}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={getReviewStatusColor(review.status)}>
            {t(`reviews.status.${review.status}`)}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    icon: <PencilSquare />,
                    label: t("actions.edit"),
                    to: "edit",
                  },
                  {
                    icon: <ChatBubbleLeftRight />,
                    label: t("reviews.respond.action"),
                    to: "respond",
                    disabled: hasResponse,
                    disabledTooltip: t("reviews.respond.alreadyResponded"),
                  },
                ],
              },
              {
                actions: [
                  {
                    icon: <Trash />,
                    label: t("actions.delete"),
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
            data-testid="review-general-section-action-menu"
          />
        </div>
      </div>

      <Row label={t("reviews.fields.rating")}>
        <StarRating rating={review.rating} />
      </Row>
      <Row label={t("reviews.fields.content")}>
        <Text size="small" leading="compact">
          {review.customer_note || "-"}
        </Text>
      </Row>
      <Row label={t("reviews.fields.response")}>
        <Text size="small" leading="compact">
          {review.seller_note || "-"}
        </Text>
      </Row>
    </Container>
  )
}
