import { CogSixTooth } from "@medusajs/icons";
import type { RouteConfig } from "@mercurjs/dashboard-sdk";

export const config: RouteConfig = {
  label: "Custom Fields",
  icon: CogSixTooth,
  nested: '/reviews'
};

export default function CustomFieldsPage() {
  return <div>Custom Fields Settings</div>;
}
