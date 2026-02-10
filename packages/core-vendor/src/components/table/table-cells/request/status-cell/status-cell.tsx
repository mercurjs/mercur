import { StatusCell as StatusCell_ } from "../../common/status-cell"

type StatusCellProps = {
  status: string
}

const getStatusColor: any = (status: string) => {
  switch (status) {
    case "pending":
      return "orange"
    case "accepted":
      return "green"
    case "rejected":
      return "red"
    default:
      return "grey"
  }
}

export const StatusCell = ({ status }: StatusCellProps) => {
  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate">
        <StatusCell_ color={getStatusColor(status)}>{status}</StatusCell_>
      </span>
    </div>
  )
}

export const StatusHeader = () => {
  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">Status</span>
    </div>
  )
}
