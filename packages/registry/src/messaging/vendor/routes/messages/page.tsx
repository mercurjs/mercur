import { useNavigate } from "react-router-dom"
import { Badge, Container, Heading, Text, clx } from "@medusajs/ui"
import { SingleColumnPage } from "@mercurjs/dashboard-shared"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"

import { useVendorConversations, ConversationDTO } from "../../hooks/api/messaging"
import { useMessagingSSE } from "../../hooks/api/use-messaging-sse"

export const config: RouteConfig = {
  label: "Messages",
}

export const handle = {
  breadcrumb: () => "Messages",
}

const formatRelativeTime = (dateStr: string | null): string => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const ConversationRow = ({
  conversation,
  onClick,
}: {
  conversation: ConversationDTO
  onClick: () => void
}) => {
  const isUnread = conversation.unread_count_seller > 0
  const senderPrefix =
    conversation.last_message_sender_type === "seller" ? "You: " : ""

  return (
    <button
      onClick={onClick}
      className={clx(
        "flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-ui-bg-base-hover",
        isUnread && "bg-ui-bg-highlight"
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <Text
            size="small"
            leading="compact"
            weight={isUnread ? "plus" : "regular"}
          >
            {conversation.buyer_first_name || "Customer"}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted shrink-0">
            {formatRelativeTime(conversation.last_message_at)}
          </Text>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Text
            size="small"
            leading="compact"
            className={clx(
              "truncate",
              isUnread ? "text-ui-fg-base" : "text-ui-fg-subtle"
            )}
          >
            {conversation.last_message_preview
              ? `${senderPrefix}${conversation.last_message_preview}`
              : "No messages yet"}
          </Text>
          {isUnread && (
            <Badge color="blue" size="2xsmall">
              {conversation.unread_count_seller}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}

const VendorMessagesPage = () => {
  useMessagingSSE()
  const navigate = useNavigate()
  const { conversations, next_cursor, isLoading, isError, error } =
    useVendorConversations({ limit: 50 })

  if (isError) throw error

  return (
    <SingleColumnPage>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Messages</Heading>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center px-6 py-12">
            <Text className="text-ui-fg-muted">Loading conversations...</Text>
          </div>
        ) : !conversations?.length ? (
          <div className="flex items-center justify-center px-6 py-12">
            <Text className="text-ui-fg-muted">No conversations yet</Text>
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                onClick={() => navigate(`/messages/${conv.id}`)}
              />
            ))}
          </div>
        )}
      </Container>
    </SingleColumnPage>
  )
}

export default VendorMessagesPage
