import { StatusCell } from "../table/table-cells/common/status-cell"

export const FulfillmentStatusBadge = ({ status }: { status: string }) => {
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1)
  switch(formattedStatus) {
    case 'Not_fulfilled':
      return <StatusCell color='orange'>{formattedStatus.replace('_', ' ')}</StatusCell>
    case 'Fulfilled':
      return <StatusCell color='green'>{formattedStatus}</StatusCell>
    case 'Delivered':
      return <StatusCell color='green'>{formattedStatus}</StatusCell>
    case 'Canceled':
      return <StatusCell color='red'>{formattedStatus}</StatusCell>
    default:
      return <StatusCell color='grey'>{formattedStatus}</StatusCell>
  }
}