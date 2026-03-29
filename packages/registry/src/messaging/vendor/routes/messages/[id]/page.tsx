import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import {
  Badge,
  Button,
  Container,
  Heading,
  Text,
  Textarea,
  clx,
} from "@medusajs/ui"
import {
  useVendorConversation,
  useMarkVendorRead,
  useSendVendorReply,
  MessageDTO,
} from "../../../hooks/api/messaging"
import { useMessagingSSE } from "../../../hooks/api/use-messaging-sse"
import { useMessagingLayout } from "../../../hooks/use-messaging-layout"

export const handle = {
  breadcrumb: () => "Conversation",
}

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

const ContextBadge = ({ message }: { message: MessageDTO }) => {
  if (!message.context_type) return null
  return (
    <Badge color="grey" size="2xsmall" className="mb-1">
      {message.context_label || `${message.context_type}: ${message.context_id}`}
    </Badge>
  )
}

const MessageBubble = ({ message }: { message: MessageDTO }) => {
  const isSeller = message.sender_type === "seller"
  return (
    <div
      className={clx(
        "flex flex-col gap-0.5",
        isSeller ? "items-end" : "items-start"
      )}
    >
      <ContextBadge message={message} />
      <div
        className={clx(
          "max-w-[70%] rounded-lg px-3 py-2",
          isSeller
            ? "bg-ui-bg-interactive text-ui-fg-on-color"
            : "bg-ui-bg-subtle text-ui-fg-base"
        )}
      >
        <Text size="small" leading="compact">
          {message.body}
        </Text>
      </div>
      <Text size="xsmall" className="text-ui-fg-muted px-1">
        {formatTime(message.created_at)}
        {isSeller && message.read_at && " · Read"}
      </Text>
    </div>
  )
}

const OrderSidebar = ({
  buyerName,
  orders,
  isBuyerBlocked,
}: {
  buyerName: string | null
  orders: any[]
  isBuyerBlocked?: boolean
}) => {
  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Customer
        </Text>
        <div className="flex items-center gap-x-2 mt-1">
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            {buyerName || "Customer"}
          </Text>
          {isBuyerBlocked && (
            <Badge color="red" size="2xsmall">
              Blocked
            </Badge>
          )}
        </div>
      </div>
      {orders.length > 0 && (
        <div className="px-6 py-4">
          <Text size="small" leading="compact" weight="plus" className="mb-2">
            Recent Orders
          </Text>
          <div className="flex flex-col gap-2">
            {orders.slice(0, 5).map((order: any) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded border border-ui-border-base px-3 py-2"
              >
                <div>
                  <Text size="small" leading="compact">
                    #{order.display_id}
                  </Text>
                  <Text
                    size="xsmall"
                    className="text-ui-fg-muted"
                  >
                    {new Date(order.created_at).toLocaleDateString()}
                  </Text>
                </div>
                <Badge color="grey" size="2xsmall">
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}

const VendorConversationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  useMessagingSSE(id)
  const [replyBody, setReplyBody] = useState("")
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const {
    conversation,
    messages,
    buyer_orders,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useVendorConversation(id!)

  const markRead = useMarkVendorRead(id!)
  const sendReply = useSendVendorReply(id!)

  useMessagingLayout()

  // Mark messages as read on mount
  useEffect(() => {
    if (conversation && conversation.unread_count_seller > 0) {
      markRead.mutate()
    }
  }, [conversation?.id, conversation?.unread_count_seller])

  // Scroll to bottom when messages change
  useEffect(() => {
    const el = messagesContainerRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages?.length])

  if (isError) throw error

  const handleSend = () => {
    const trimmed = replyBody.trim()
    if (!trimmed || sendReply.isPending) return

    sendReply.mutate(
      { body: trimmed },
      { onSuccess: () => setReplyBody("") }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-ui-fg-muted">Loading conversation...</Text>
      </div>
    )
  }

  // Messages come in desc order from API; reverse for display
  const displayMessages = [...(messages ?? [])].reverse()

  return (
    <div id="chat-root" ref={rootRef} className="flex gap-4 h-full min-h-0">
      {/* Main: Message Thread */}
      <div id="chat-card" className="flex-1 flex flex-col min-h-0 bg-ui-bg-base rounded-lg shadow-elevation-card-rest overflow-hidden">
        <div id="chat-header" className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base shrink-0">
          <Heading level="h2">
            {conversation?.buyer_first_name || "Customer"}
          </Heading>
        </div>

        {/* Messages list */}
        <div
          id="chat-messages"
          ref={messagesContainerRef}
          className="flex-1 flex flex-col gap-3 px-6 py-4 overflow-y-auto min-h-0"
        >
          {hasNextPage && (
            <div className="flex justify-center shrink-0">
              <Button
                size="small"
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                isLoading={isFetchingNextPage}
              >
                Load older messages
              </Button>
            </div>
          )}
          {displayMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Compose area */}
        {conversation?.is_buyer_blocked ? (
          <div className="border-t border-ui-border-base px-6 py-4 shrink-0">
            <Text size="small" className="text-ui-fg-muted">
              This customer has been blocked from chat by an administrator.
            </Text>
          </div>
        ) : (
          <div id="chat-compose" className="border-t border-ui-border-base px-6 py-4 shrink-0">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none"
                rows={2}
              />
              <Button
                size="small"
                onClick={handleSend}
                disabled={!replyBody.trim() || sendReply.isPending}
                isLoading={sendReply.isPending}
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar: Customer + Orders */}
      <div id="chat-sidebar" className="w-[280px] shrink-0 overflow-y-auto">
        <OrderSidebar
          buyerName={conversation?.buyer_first_name ?? null}
          orders={buyer_orders ?? []}
          isBuyerBlocked={conversation?.is_buyer_blocked}
        />
      </div>
    </div>
  )
}

export default VendorConversationDetailPage
