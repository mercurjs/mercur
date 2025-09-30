import { StatusBadge } from "@medusajs/ui";

export const getRequestStatusBadge = (status: string) => {
  let color: "grey" | "orange" | "green" | "red" = "grey";
  if (status === "pending") {
    color = "orange";
  }

  if (status === "accepted") {
    color = "green";
  }

  if (status === "rejected") {
    color = "red";
  }

  return <StatusBadge color={color}>{status}</StatusBadge>;
};
