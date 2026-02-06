import { useCallback } from "react"
import Talk from "talkjs"
import { Session } from "@talkjs/react"

import { useMe } from "../../hooks/api"

export const TalkjsProvider = ({ children }: { children: React.ReactNode }) => {
  const { seller, isPending } = useMe()

  if (isPending)
    return <div className="flex justify-center items-center h-screen" />

  return <ProviderContent seller={seller}>{children}</ProviderContent>
}

const ProviderContent = ({
  children,
  seller,
}: {
  children: React.ReactNode
  seller: any
}) => {
  const syncUser = useCallback(() => {
    return new Talk.User({
      id: seller?.id || "",
      name: seller?.name || "",
      email: seller?.email || null,
      photoUrl: seller?.photo || "/talkjs-placeholder.jpg",
    })
  }, [seller])

  if (!__TALK_JS_APP_ID__ || !seller) return <>{children}</>

  return (
    <Session appId={__TALK_JS_APP_ID__} syncUser={syncUser}>
      {children}
    </Session>
  )
}
