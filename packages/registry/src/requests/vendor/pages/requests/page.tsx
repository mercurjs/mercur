import { Navigate } from "react-router-dom";
import type { RouteConfig } from "@mercurjs/dashboard-sdk";
import { InboxSolid } from "@medusajs/icons";

export const config: RouteConfig = {
  label: "Requests",
  icon: InboxSolid,
};

export const handle = {
  breadcrumb: () => "Requests",
};

const RequestsPage = () => {
  return <Navigate to="/requests/categories" replace />;
};

export default RequestsPage;
