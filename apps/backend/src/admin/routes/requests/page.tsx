import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QueueList } from "@medusajs/icons";

const RequestsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/requests/seller");
  });

  return <></>;
};

export const config = defineRouteConfig({
  label: "Requests",
  icon: QueueList,
});

export default RequestsPage;
