import { StatusCell } from "../table/table-cells/common/status-cell"

export const ProductStatusBadge = ({ status }: { status: string }) => {
  const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1)
  switch(formattedStatus) {
    case '':
      return <StatusCell color='orange'>{formattedStatus}</StatusCell>
    case 'Published':
      return <StatusCell color='green'>{formattedStatus}</StatusCell>
    case 'Canceled':
      return <StatusCell color='red'>{formattedStatus}</StatusCell>
    case 'Draft':
      return <StatusCell color='grey'>{formattedStatus}</StatusCell>
    default:
      return <StatusCell color='grey'>{formattedStatus}</StatusCell>
  }
}