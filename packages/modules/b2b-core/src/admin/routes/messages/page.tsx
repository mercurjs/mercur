import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubble } from "@medusajs/icons"
import { Container, Heading, Label } from "@medusajs/ui"
import { Inbox, Session } from "@talkjs/react"
import { useCallback } from "react"
import Talk from "talkjs"
import { useTalkJS } from "../../hooks/api/talk-js"

// const TALK_JS_APP_ID = import.meta.env.DEV ? import.meta.env.VITE_TALK_JS_APP_ID || "" : process.env.VITE_TALK_JS_APP_ID || ""

const MessagesPage = () => {
  const {app_id, isLoading} = useTalkJS()

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
        {isLoading ? <div className="flex items-center justify-center h-full">Loading...</div> : app_id ? (
        <Session appId={app_id} syncUser={syncUser}>
          <Inbox className="h-full" />
        </Session>
        ): (
          <div className="flex flex-col items-center justify-center h-full">
            <Heading>No TalkJS App ID</Heading>
            <Label className="mt-4">Please set the TALK_JS_APP_ID environment variable</Label>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Messages",
  icon: ChatBubble,
})

export default MessagesPage