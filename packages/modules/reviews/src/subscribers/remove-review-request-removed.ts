import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { RemoveReviewRequestUpdatedEvent } from "@mercurjs/framework";
import { deleteReviewWorkflow } from "../workflows";

export default async function commissionOrderSetPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  await deleteReviewWorkflow.run({
    container,
    input: {
      id: event.data.id,
    },
  });
}

export const config: SubscriberConfig = {
  event: RemoveReviewRequestUpdatedEvent.REMOVED,
  context: {
    subscriberId: "remove-review-request-removed-handler",
  },
};
