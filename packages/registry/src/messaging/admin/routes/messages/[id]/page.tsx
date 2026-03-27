import { useLayoutEffect, useRef } from "react"
import { useParams } from "react-router-dom"
import { Badge, Button, Container, Heading, Text, clx } from "@medusajs/ui"

import {
  useAdminConversation,
  AdminMessageDTO,
} from "../../../hooks/api/messaging"
import { useAdminMessagingSSE } from "../../../hooks/api/use-admin-messaging-sse"

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr)
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
}

const MessageRow = ({ message }: { message: AdminMessageDTO }) => {
  const isCustomer = message.sender_type === "customer"

  return (
    <div
      className={clx(
        "flex flex-col gap-0.5",
        isCustomer ? "items-start" : "items-end"
      )}
    >
      {message.context_type && (
        <Badge color="grey" size="2xsmall">
          {message.context_label || `${message.context_type}: ${message.context_id}`}
        </Badge>
      )}
      <div
        className={clx(
          "max-w-[70%] rounded-lg px-3 py-2",
          isCustomer
            ? "bg-ui-bg-subtle text-ui-fg-base"
            : "bg-ui-bg-field text-ui-fg-base"
        )}
      >
        <Text size="xsmall" className="text-ui-fg-muted mb-0.5">
          {isCustomer ? "Customer" : "Vendor"}
        </Text>
        <Text size="small" leading="compact">
          {message.body}
        </Text>
      </div>
      <Text size="xsmall" className="text-ui-fg-muted px-1">
        {formatTime(message.created_at)}
        {message.read_at && " · Read"}
      </Text>
    </div>
  )
}

const AdminConversationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  useAdminMessagingSSE(id)

  const rootRef = useRef<HTMLDivElement>(null)

  const {
    conversation,
    messages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useAdminConversation(id!)

  useLayoutEffect(() => {
    const main = document.querySelector("main") as HTMLElement | null
    const contentCol = main?.parentElement as HTMLElement | null
    const gutter = main?.firstElementChild as HTMLElement | null

    const origMain = main?.style.cssText ?? ""
    const origCol = contentCol?.style.cssText ?? ""
    const origGutter = gutter?.style.cssText ?? ""

    if (contentCol) contentCol.style.overflow = "hidden"
    if (main) {
      main.style.overflow = "hidden"
      main.style.minHeight = "0"
    }
    if (gutter) {
      gutter.style.flex = "1"
      gutter.style.minHeight = "0"
      gutter.style.overflow = "hidden"
    }

    return () => {
      if (main) main.style.cssText = origMain
      if (contentCol) contentCol.style.cssText = origCol
      if (gutter) gutter.style.cssText = origGutter
    }
  }, [])

  if (isError) throw error

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Text className="text-ui-fg-muted">Loading conversation...</Text>
      </div>
    )
  }

  const displayMessages = [...(messages ?? [])].reverse()

  return (
    <div ref={rootRef} className="flex gap-4 h-full min-h-0">
      {/* Main: Read-only message thread */}
      <div className="flex-1 flex flex-col min-h-0 bg-ui-bg-base rounded-lg shadow-elevation-card-rest overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border-base shrink-0">
          <Heading level="h2">Conversation</Heading>
          <Badge color="grey" size="small">
            Read-only
          </Badge>
        </div>
        <div className="flex-1 flex flex-col gap-3 px-6 py-4 overflow-y-auto min-h-0">
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
            <MessageRow key={msg.id} message={msg} />
          ))}
          {!displayMessages.length && (
            <Text className="text-ui-fg-muted text-center py-8">
              No messages in this conversation
            </Text>
          )}
        </div>
      </div>

      {/* Sidebar: Conversation metadata */}
      <div className="w-[300px] shrink-0 overflow-y-auto">
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Text size="small" leading="compact" weight="plus">
              Conversation Details
            </Text>
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Vendor
            </Text>
            <Text size="small" leading="compact">
              {conversation?.seller_name || conversation?.seller_id}
            </Text>
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Customer
            </Text>
            <Text size="small" leading="compact">
              {conversation?.buyer_name || conversation?.buyer_id}
            </Text>
            {conversation?.buyer_email && (
              <Text size="xsmall" className="text-ui-fg-subtle">
                {conversation.buyer_email}
              </Text>
            )}
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Created
            </Text>
            <Text size="small" leading="compact">
              {conversation?.created_at
                ? new Date(conversation.created_at).toLocaleString()
                : "-"}
            </Text>
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Last Activity
            </Text>
            <Text size="small" leading="compact">
              {conversation?.last_message_at
                ? new Date(conversation.last_message_at).toLocaleString()
                : "-"}
            </Text>
          </div>
          <div className="px-6 py-3">
            <Text size="xsmall" className="text-ui-fg-muted">
              Message Count
            </Text>
            <Text size="small" leading="compact">
              {messages?.length ?? 0}
            </Text>
          </div>
        </Container>
      </div>
    </div>
  )
}

export default AdminConversationDetailPage
