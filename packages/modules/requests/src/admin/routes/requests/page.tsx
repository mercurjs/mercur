import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Navigate } from "react-router-dom";
import { QueueList } from "@medusajs/icons";

const RequestsPage = () => {
  return <Navigate to={"/requests/seller"} />;
};

export const config = defineRouteConfig({
  label: "Requests",
  icon: QueueList,
});

export default RequestsPage;
