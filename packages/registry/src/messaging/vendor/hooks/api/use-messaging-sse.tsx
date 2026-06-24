import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { conversationsQueryKeys, unreadQueryKeys } from "./messaging"

declare const __BACKEND_URL__: string

type SSEStatus = "connecting" | "connected" | "disconnected" | "polling"

const POLLING_INTERVAL_LIST = 30000
const POLLING_INTERVAL_UNREAD = 15000

export const useMessagingSSE = (
  activeConversationId?: string,
  onStatusChange?: (status: SSEStatus) => void
) => {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const unreadPollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectDelayRef = useRef(1000)
  const statusRef = useRef<SSEStatus>("disconnected")
  const mountedRef = useRef(true)

  // Store callbacks in refs to avoid dependency chains
  const onStatusChangeRef = useRef(onStatusChange)
  onStatusChangeRef.current = onStatusChange

  const activeIdRef = useRef(activeConversationId)
  activeIdRef.current = activeConversationId

  useEffect(() => {
    mountedRef.current = true

    const setStatus = (status: SSEStatus) => {
      statusRef.current = status
      onStatusChangeRef.current?.(status)
    }

    const invalidateQueries = () => {
      queryClient.invalidateQueries({ queryKey: conversationsQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: unreadQueryKeys.all })
    }

    const invalidateConversation = (conversationId: string) => {
      queryClient.invalidateQueries({
        queryKey: conversationsQueryKeys.detail(conversationId),
      })
    }

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      if (unreadPollingRef.current) {
        clearInterval(unreadPollingRef.current)
        unreadPollingRef.current = null
      }
    }

    const startPolling = () => {
      if (pollingRef.current) return
      setStatus("polling")

      pollingRef.current = setInterval(() => {
        invalidateQueries()
      }, POLLING_INTERVAL_LIST)

      unreadPollingRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: unreadQueryKeys.all })
      }, POLLING_INTERVAL_UNREAD)
    }

    const connect = () => {
      if (!mountedRef.current) return

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      setStatus("connecting")

      const baseUrl = typeof __BACKEND_URL__ !== "undefined" ? __BACKEND_URL__ : ""
      const url = `${baseUrl}/vendor/messages/events`

      const es = new EventSource(url, { withCredentials: true })
      eventSourceRef.current = es

      es.addEventListener("connected", () => {
        setStatus("connected")
        stopPolling()
        reconnectDelayRef.current = 1000 // Reset backoff on success
      })

      es.addEventListener("new_message", (event: MessageEvent) => {
        invalidateQueries()
        try {
          const data = JSON.parse(event.data)
          if (data.conversation_id) {
            invalidateConversation(data.conversation_id)
          }
        } catch {
          // Broad invalidation already handled above
        }
      })

      es.addEventListener("messages_read", (event: MessageEvent) => {
        invalidateQueries()
        try {
          const data = JSON.parse(event.data)
          if (data.conversation_id) {
            invalidateConversation(data.conversation_id)
          }
        } catch {
          // Broad invalidation already handled above
        }
      })

      es.addEventListener("unread_count", () => {
        queryClient.invalidateQueries({ queryKey: unreadQueryKeys.all })
      })

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null
        startPolling()

        // Exponential backoff: 1s, 2s, 4s, 8s, ..., max 30s
        const delay = reconnectDelayRef.current
        reconnectDelayRef.current = Math.min(delay * 2, 30000)

        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null
          if (mountedRef.current && statusRef.current === "polling") {
            connect()
          }
        }, delay)
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
