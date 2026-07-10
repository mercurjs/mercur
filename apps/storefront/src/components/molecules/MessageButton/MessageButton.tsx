"use client"

import { Badge } from "@/components/atoms"
import { MessageIcon } from "@/icons"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { useUnreads } from "@talkjs/react"

export const MessageButton = () => {
  const unreads = useUnreads()

  return (
    <LocalizedClientLink href="/user/messages" className="relative">
      <MessageIcon size={20} />
      {Boolean(unreads?.length) && (
        <Badge className="absolute -top-2 -right-2 w-4 h-4 p-0">
          {unreads?.length}
        </Badge>
      )}
    </LocalizedClientLink>
  )
}
