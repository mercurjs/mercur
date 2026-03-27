import { createColumnHelper } from "@tanstack/react-table"
import { useMemo } from "react"
import { StatusBadge, Text } from "@medusajs/ui"
import { DateCell, DateHeader } from "@mercurjs/dashboard-shared"
import { ConversationDTO } from "../../api/messaging"

const columnHelper = createColumnHelper<ConversationDTO>()

export const useConversationTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("buyer_first_name", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Customer</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const name = getValue()
          return (
            <Text size="small" leading="compact">
              {name || "Customer"}
            </Text>
          )
        },
      }),
      columnHelper.accessor("last_message_preview", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Last Message</span>
          </div>
        ),
        cell: ({ getValue, row }) => {
          const preview = getValue()
          const senderType = row.original.last_message_sender_type
          const prefix = senderType === "seller" ? "You: " : ""
          return (
            <div className="flex h-full w-full items-center overflow-hidden">
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle truncate"
              >
                {preview ? `${prefix}${preview}` : "No messages yet"}
              </Text>
            </div>
          )
        },
      }),
      columnHelper.accessor("unread_count_seller", {
        header: () => (
          <div className="flex h-full w-full items-center">
            <span className="truncate">Unread</span>
          </div>
        ),
        cell: ({ getValue }) => {
          const count = getValue()
          if (!count) return null
          return (
            <StatusBadge color="blue">{count}</StatusBadge>
          )
        },
      }),
      columnHelper.accessor("last_message_at", {
        header: () => <DateHeader />,
        cell: ({ getValue }) => {
          const val = getValue()
          if (!val) return <Text size="small" className="text-ui-fg-muted">-</Text>
          const date = new Date(val)
          return <DateCell date={date} />
        },
      }),
    ],
    []
  )
}
