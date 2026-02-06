import { ChatBubble } from "@medusajs/icons"
import { Drawer, Heading, IconButton } from "@medusajs/ui"
import { Chatbox } from "@talkjs/react"
import { useCallback, useState } from "react"
import { useMe } from "../../../hooks/api"
import Talk from "talkjs"

export const AdminChat = () => {
  const [open, setOpen] = useState(false)

  const { seller, isPending } = useMe()

  if (isPending)
    return <div className="flex justify-center items-center h-screen" />

  const handleOnOpen = (shouldOpen: boolean) => {
    if (shouldOpen) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  const syncConversation = useCallback((session: any) => {
    const conversation = session.getOrCreateConversation(
      `admin-vendor-${seller?.id}`
    )

    const other = new Talk.User({
      id: "admin",
      name: "Admin",
      welcomeMessage: "Hey, how can I help?",
    })

    conversation.setParticipant(other)
    conversation.setParticipant(session.me)

    return conversation
  }, [])

  return (
    <Drawer open={open} onOpenChange={handleOnOpen}>
      <Drawer.Trigger asChild>
        <IconButton
          variant="transparent"
          className="text-ui-fg-muted hover:text-ui-fg-subtle"
        >
          <ChatBubble />
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title asChild>
            <Heading>Chat with admin</Heading>
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="overflow-y-auto px-4">
          <Chatbox
            syncConversation={syncConversation}
            style={{ width: "100%", height: "100%" }}
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}
