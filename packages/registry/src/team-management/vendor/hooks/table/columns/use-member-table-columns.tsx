import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { Text } from "@medusajs/ui"
import type { MemberDTO } from "../../api/members"

const columnHelper = createColumnHelper<MemberDTO>()

export const useMemberTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("email", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Email</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const email = getValue()
          return (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {email || "-"}
            </Text>
          )
        },
      }),
      columnHelper.accessor("name", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Name</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const name = getValue()
          return (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {name || "-"}
            </Text>
          )
        },
      }),
    ],
    []
  )
}
