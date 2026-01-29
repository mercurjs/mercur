import { StatusCell } from "@components/table/table-cells/common/status-cell";

export const SellerStatusBadge = ({ 
  status, 
  "data-testid": dataTestId 
}: { 
  status: string
  "data-testid"?: string 
}) => {
  switch (status) {
    case "INACTIVE":
      return <StatusCell color="orange" data-testid={dataTestId}>{status}</StatusCell>;
    case "ACTIVE":
      return <StatusCell color="green" data-testid={dataTestId}>{status}</StatusCell>;
    case "SUSPENDED":
      return <StatusCell color="red" data-testid={dataTestId}>{status}</StatusCell>;
    default:
      return <StatusCell color="grey" data-testid={dataTestId}>{status}</StatusCell>;
  }
};
