import { PlaceholderCell } from "../placeholder-cell"

type NameCellProps = {
  firstName?: string | null
  lastName?: string | null
}

export const NameCell = ({ firstName, lastName }: NameCellProps) => {
  if (!firstName && !lastName) {
    return <PlaceholderCell />
  }

  const name = [firstName, lastName].filter(Boolean).join(" ")

  return (
    <div className="flex h-full w-full items-center overflow-hidden">
      <span className="truncate">{name}</span>
    </div>
  )
}

export const NameHeader = () => {

  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">Name</span>
    </div>
  )
}
