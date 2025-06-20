import { StatusCell } from "../table/table-cells/common/status-cell"

export const SellerStatusBadge = ({ status }: { status: string }) => {
  switch(status) {
    case "INACTIVE":
      return <StatusCell color='orange'>{status}</StatusCell>
    case 'ACTIVE':
      return <StatusCell color='green'>{status}</StatusCell>
    case 'SUSPENDED':
      return <StatusCell color='red'>{status}</StatusCell>
    default:
      return <StatusCell color='grey'>{status}</StatusCell>
  }
}