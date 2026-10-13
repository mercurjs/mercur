import type { VendorReturnRequest } from "@hooks/api/return-requests";

type StatusColor = "green" | "red" | "orange" | "blue" | "grey" | "purple";

export const RETURN_REQUEST_STATUSES = [
  "pending",
  "accepted",
  "awaiting_return",
  "returned",
  "refunded",
  "declined",
  "withdrawn",
] as const;

export const getReturnRequestStatusProps = (
  status: VendorReturnRequest["status"],
  t: (key: string) => string,
): { color: StatusColor; label: string } => {
  const label = t(`returnRequests.status.${status}`);

  switch (status) {
    case "refunded":
      return { color: "green", label };
    case "declined":
      return { color: "red", label };
    case "withdrawn":
      return { color: "grey", label };
    case "accepted":
    case "awaiting_return":
      return { color: "blue", label };
    case "returned":
      return { color: "purple", label };
    case "pending":
    default:
      return { color: "orange", label };
  }
};

export const customerName = (
  customer?: VendorReturnRequest["customer"] | null,
) => {
  if (!customer) {
    return "-";
  }
  const name = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ");
  return name || customer.email || "-";
};
