import { Badge, Container, Heading, Text } from "@medusajs/ui"

import { useAdminBlockedMessages, BlockedMessageDTO } from "../../../hooks/api/filters"

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString()
}

const BlockedRow = ({ log }: { log: BlockedMessageDTO }) => {
  return (
    <div className="px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            color={log.sender_type === "customer" ? "blue" : "green"}
            size="2xsmall"
          >
            {log.sender_type}
          </Badge>
          <Text size="small" leading="compact" weight="plus">
            {log.sender_id}
          </Text>
        </div>
        <Text size="xsmall" className="text-ui-fg-muted">
          {formatDate(log.created_at)}
        </Text>
      </div>
      <Text
        size="small"
        leading="compact"
        className="text-ui-fg-subtle mt-1 line-clamp-2"
      >
        {log.message_body}
      </Text>
    </div>
  )
}

const AdminBlockedMessagesPage = () => {
  const { blocked_messages, count, isLoading, isError, error } =
    useAdminBlockedMessages()

  if (isError) throw error

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Blocked Messages</Heading>
        {count != null && (
          <Text size="small" className="text-ui-fg-muted">
            {count} total
          </Text>
        )}
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Text className="text-ui-fg-muted">Loading...</Text>
        </div>
      ) : !blocked_messages?.length ? (
        <div className="flex items-center justify-center py-12">
          <Text className="text-ui-fg-muted">No blocked messages</Text>
        </div>
      ) : (
        <div className="divide-y">
          {blocked_messages.map((log) => (
            <BlockedRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </Container>
  )
}

export default AdminBlockedMessagesPage
