import { Navigate } from "react-router-dom";
import type { RouteConfig } from "@mercurjs/dashboard-sdk";

export const config: RouteConfig = {
  label: "Requests",
};

const VendorRequestsPage = () => {
  return <Navigate to="/requests/categories" replace />;
};

export default VendorRequestsPage;
