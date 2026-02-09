import { CogSixTooth } from "@medusajs/icons";
import type { RouteConfig } from "@mercurjs/dashboard-sdk";

export const config: RouteConfig = {
  label: "Custom Fields",
  rank: 1,
  icon: CogSixTooth,
};

export default function CustomFieldsPage() {
  return <div>Custom Fields Settings</div>;
}
