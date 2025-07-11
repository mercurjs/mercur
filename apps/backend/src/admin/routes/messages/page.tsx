import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubble } from "@medusajs/icons"
import { Container, Heading } from "@medusajs/ui"
import { Inbox, Session } from "@talkjs/react"
import { useCallback } from "react"
import Talk from "talkjs"

const TALK_JS_APP_ID = import.meta.env.VITE_TALK_JS_APP_ID || ""

const MessagesPage = () => {
  const syncUser = useCallback(
    () =>
      new Talk.User({
        id: "admin",
        name: "Admin",
      }),
    []
  )

  return (
    <Container>
      <Heading>Messages</Heading>
      <div className="py-4 h-[600px]">
        <Session appId={TALK_JS_APP_ID} syncUser={syncUser}>
          <Inbox className="h-full" />
        </Session>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Messages",
  icon: ChatBubble,
})

export default MessagesPage