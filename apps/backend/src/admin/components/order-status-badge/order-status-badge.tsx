import { StatusCell } from "../table/table-cells/common/status-cell"

export const OrderStatusBadge = ({ status }: { status: string }) => {
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1)
  switch(formattedStatus) {
    case 'Pending':
      return <StatusCell color='orange'>{formattedStatus}</StatusCell>
    case 'Completed':
      return <StatusCell color='green'>{formattedStatus}</StatusCell>
    case 'Canceled':
      return <StatusCell color='red'>{formattedStatus}</StatusCell>
    default:
      return <StatusCell color='grey'>{formattedStatus}</StatusCell>
  }
}