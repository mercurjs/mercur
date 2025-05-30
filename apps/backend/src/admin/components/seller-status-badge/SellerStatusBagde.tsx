import { StatusCell } from "../table/table-cells/common/status-cell"

export const SellerStatusBadge = ({ status }: { status: string }) => {
  switch(status) {
    case 'pending':
      return <StatusCell color='orange'>{status}</StatusCell>
    case 'active':
      return <StatusCell color='green'>{status}</StatusCell>
    case 'suspended':
      return <StatusCell color='red'>{status}</StatusCell>
    default:
      return <StatusCell color='grey'>{status}</StatusCell>
  }
}