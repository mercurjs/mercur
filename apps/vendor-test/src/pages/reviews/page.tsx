import { Star } from "@medusajs/icons";
import type { RouteConfig } from "@mercurjs/dashboard-sdk";

export const config: RouteConfig = {
  label: "Reviews",
  icon: Star,
};

export default function ReviewsPage() {
  return <div>Reviews List</div>;
}
