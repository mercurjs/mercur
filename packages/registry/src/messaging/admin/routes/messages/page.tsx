import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button, Container, Heading, Input, Label, Text } from "@medusajs/ui"
import type { RouteConfig } from "@mercurjs/dashboard-sdk"

import { useAdminConversations, AdminConversationDTO } from "../../hooks/api/messaging"
import { useAdminMessagingSSE } from "../../hooks/api/use-admin-messaging-sse"

export const config: RouteConfig = {
  label: "Messages",
}

export const handle = {
  breadcrumb: () => "Messages",
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleString()
}

const ConversationRow = ({
  conversation,
  onClick,
}: {
  conversation: AdminConversationDTO
  onClick: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors hover:bg-ui-bg-base-hover"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text size="small" leading="compact" weight="plus">
            {conversation.seller_name || conversation.seller_id}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted">
            &harr;
          </Text>
          <Text size="small" leading="compact" weight="plus">
            {conversation.buyer_name || conversation.buyer_id}
          </Text>
        </div>
        <Text
          size="small"
          leading="compact"
          className="text-ui-fg-subtle truncate mt-0.5"
        >
          {conversation.last_message_preview || "No messages"}
        </Text>
      </div>
      <div className="shrink-0 text-right">
        <Text size="xsmall" className="text-ui-fg-muted">
          {formatDate(conversation.last_message_at)}
        </Text>
        {(conversation.buyer_email) && (
          <Text size="xsmall" className="text-ui-fg-muted">
            {conversation.buyer_email}
          </Text>
        )}
      </div>
    </button>
  )
}

const AdminMessagesPage = () => {
  useAdminMessagingSSE()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useState<{
    seller_name?: string
    buyer_name?: string
    date_from?: string
    date_to?: string
  }>({})

  const [formState, setFormState] = useState({
    seller_name: "",
    buyer_name: "",
    date_from: "",
    date_to: "",
  })

  const { conversations, next_cursor, isLoading, isError, error } =
    useAdminConversations({ limit: 50, ...searchParams })

  if (isError) throw error

  const handleSearch = () => {
    setSearchParams({
      seller_name: formState.seller_name || undefined,
      buyer_name: formState.buyer_name || undefined,
      date_from: formState.date_from || undefined,
      date_to: formState.date_to || undefined,
    })
  }

  const handleClear = () => {
    setFormState({ seller_name: "", buyer_name: "", date_from: "", date_to: "" })
    setSearchParams({})
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search Form */}
      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading>Message Oversight</Heading>
        </div>
        <div className="grid grid-cols-2 gap-3 px-6 pb-4">
          <div>
            <Label size="xsmall">Vendor Name</Label>
            <Input
              size="small"
              placeholder="Search vendor..."
              value={formState.seller_name}
              onChange={(e) =>
                setFormState((s) => ({ ...s, seller_name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label size="xsmall">Customer Name</Label>
            <Input
              size="small"
              placeholder="Search customer..."
              value={formState.buyer_name}
              onChange={(e) =>
                setFormState((s) => ({ ...s, buyer_name: e.target.value }))
              }
            />
          </div>
          <div>
            <Label size="xsmall">Date From</Label>
            <Input
              size="small"
              type="date"
              value={formState.date_from}
              onChange={(e) =>
                setFormState((s) => ({ ...s, date_from: e.target.value }))
              }
            />
          </div>
          <div>
            <Label size="xsmall">Date To</Label>
            <Input
              size="small"
              type="date"
              value={formState.date_to}
              onChange={(e) =>
                setFormState((s) => ({ ...s, date_to: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-4">
          <Button size="small" onClick={handleSearch}>
            Search
          </Button>
          <Button size="small" variant="secondary" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </Container>

      {/* Results */}
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Text size="small" weight="plus">
            Conversations
          </Text>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Text className="text-ui-fg-muted">Loading...</Text>
          </div>
        ) : !conversations?.length ? (
          <div className="flex items-center justify-center py-12">
            <Text className="text-ui-fg-muted">No conversations found</Text>
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
    </div>
  )
}

export default AdminMessagesPage
