import { PlaceholderCell } from "../../common/placeholder-cell"

type CustomerCellProps = {
  customer?: string | null
}

export const CustomerCell = ({ customer }: CustomerCellProps) => {
  if (!customer) {
    return <PlaceholderCell />
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate">{customer}</span>
    </div>
  )
}

export const CustomerHeader = () => {
  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">Customer</span>
    </div>
  )
}
