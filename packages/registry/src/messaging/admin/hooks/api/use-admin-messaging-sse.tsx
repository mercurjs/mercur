import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

declare const __BACKEND_URL__: string

type SSEStatus = "connecting" | "connected" | "disconnected" | "polling"

const ADMIN_CONVERSATIONS_KEY = "admin_conversations"
const ADMIN_CONVERSATION_KEY = "admin_conversation"
const POLLING_INTERVAL = 30000

export const useAdminMessagingSSE = (
  activeConversationId?: string,
  onStatusChange?: (status: SSEStatus) => void
) => {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const statusRef = useRef<SSEStatus>("disconnected")
  const mountedRef = useRef(true)

  // Store callbacks in refs to avoid dependency chains
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  useEffect(() => {
    mountedRef.current = true

    const setStatus = (status: SSEStatus) => {
      statusRef.current = status
      onStatusChangeRef.current?.(status)
    }

    const invalidateAll = () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATION_KEY] })
    }

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    const startPolling = () => {
      if (pollingRef.current) return
      setStatus("polling")

      pollingRef.current = setInterval(() => {
        invalidateAll()
      }, POLLING_INTERVAL)
    }

    const connect = () => {
      if (!mountedRef.current) return

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      setStatus("connecting")

      const baseUrl = typeof __BACKEND_URL__ !== "undefined" ? __BACKEND_URL__ : ""
      const url = `${baseUrl}/admin/messages/events`

      const es = new EventSource(url, { withCredentials: true })
      eventSourceRef.current = es

      es.addEventListener("connected", () => {
        setStatus("connected")
        stopPolling()
      })

      es.addEventListener("new_message", (event: MessageEvent) => {
        queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] })
        try {
          const data = JSON.parse(event.data)
          if (data.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: [ADMIN_CONVERSATION_KEY, data.conversation_id],
            })
          }
        } catch {
          queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATION_KEY] })
        }
      })

      es.addEventListener("messages_read", (event: MessageEvent) => {
        queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] })
        try {
          const data = JSON.parse(event.data)
          if (data.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: [ADMIN_CONVERSATION_KEY, data.conversation_id],
            })
          }
        } catch {
          queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATION_KEY] })
        }
      })

      es.addEventListener("unread_count", () => {
        queryClient.invalidateQueries({ queryKey: [ADMIN_CONVERSATIONS_KEY] })
      })

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null
        startPolling()

        // Schedule reconnect — track timer so cleanup can cancel it
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null
          if (mountedRef.current && statusRef.current === "polling") {
            connect()
          }
        }, 5000)
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      stopPolling()
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }
  }, [queryClient]) // queryClient is stable — no re-render loop

  return { status: statusRef.current }
}
