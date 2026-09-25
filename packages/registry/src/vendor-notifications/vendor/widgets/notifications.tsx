import {
  BellAlert,
  BellAlertDone,
  InformationCircleSolid,
} from "@medusajs/icons"
import { clx, Drawer, Heading, IconButton, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { defineWidgetConfig } from "@mercurjs/dashboard-sdk"
import {
  FilePreview,
  InfiniteList,
  queryKeysFactory,
  useDate,
} from "@mercurjs/dashboard-shared"

declare const __BACKEND_URL__: string

type NotificationData = {
  title: string
  description?: string
  file?: {
    filename?: string
    url?: string
    mimeType?: string
  }
}

type VendorNotification = {
  id: string
  created_at: string
  data: NotificationData | null
}

type VendorNotificationListResponse = {
  notifications: VendorNotification[]
  count: number
  offset: number
  limit: number
}

type VendorNotificationListParams = {
  offset?: number
  limit?: number
  fields?: string
}

const LAST_READ_NOTIFICATION_KEY = "notificationsLastReadAt"

const notificationQueryKeys = queryKeysFactory("vendor_notifications")

const fetchNotifications = async (
  params: VendorNotificationListParams
): Promise<VendorNotificationListResponse> => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }

  const response = await fetch(
    `${__BACKEND_URL__}/vendor/notifications?${search.toString()}`,
    { credentials: "include" }
  )

  if (!response.ok) {
    throw new Error(`Failed to load notifications (${response.status})`)
  }

  return response.json()
}

const Notifications = () => {
  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useUnreadNotifications()
  // Lags behind localStorage so rows stay marked unread while the drawer is open
  const [lastReadAt, setLastReadAt] = useState(
    localStorage.getItem(LAST_READ_NOTIFICATION_KEY)
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const handleOnOpen = (shouldOpen: boolean) => {
    if (shouldOpen) {
      setHasUnread(false)
      setOpen(true)
      localStorage.setItem(LAST_READ_NOTIFICATION_KEY, new Date().toISOString())
    } else {
      setOpen(false)
      setLastReadAt(localStorage.getItem(LAST_READ_NOTIFICATION_KEY))
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOnOpen}>
      <Drawer.Trigger asChild>
        <IconButton
          variant="transparent"
          size="small"
          className="text-ui-fg-muted hover:text-ui-fg-subtle"
          data-testid="vendor-notifications-trigger"
        >
          {hasUnread ? <BellAlertDone /> : <BellAlert />}
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Content data-testid="vendor-notifications-drawer">
        <Drawer.Header>
          <Drawer.Title asChild>
            <Heading>Notifications</Heading>
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Notifications about your store will be listed here.
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="overflow-y-auto px-0">
          <InfiniteList<
            VendorNotificationListResponse,
            VendorNotification,
            VendorNotificationListParams
          >
            responseKey="notifications"
            queryKey={notificationQueryKeys.all}
            queryFn={fetchNotifications}
            queryOptions={{ enabled: open }}
            renderEmpty={() => <NotificationsEmptyState />}
            renderItem={(notification) => (
              <Notification
                key={notification.id}
                notification={notification}
                unread={
                  Date.parse(notification.created_at) >
                  (lastReadAt ? Date.parse(lastReadAt) : 0)
                }
              />
            )}
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

const Notification = ({
  notification,
  unread,
}: {
  notification: VendorNotification
  unread?: boolean
}) => {
  const { getRelativeDate } = useDate()
  const data = notification.data

  if (!data?.title) {
    return null
  }

  return (
    <div className="relative flex items-start justify-center gap-3 border-b p-6">
      <div className="text-ui-fg-muted flex size-5 items-center justify-center">
        <InformationCircleSolid />
      </div>
      <div className="flex w-full flex-col gap-y-3">
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <Text size="small" leading="compact" weight="plus">
              {data.title}
            </Text>
            <div className="align-center flex items-center justify-center gap-2">
              <Text
                as="span"
                className={clx("text-ui-fg-subtle", {
                  "text-ui-fg-base": unread,
                })}
                size="small"
                leading="compact"
                weight="plus"
              >
                {getRelativeDate(notification.created_at)}
              </Text>
              {unread && (
                <div
                  className="bg-ui-bg-interactive h-2 w-2 rounded"
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                  role="status"
                />
              )}
            </div>
          </div>
          {!!data.description && (
            <Text
              className="text-ui-fg-subtle whitespace-pre-line"
              size="small"
            >
              {data.description}
            </Text>
          )}
        </div>
        {!!data.file?.url && (
          <FilePreview
            filename={data.file.filename ?? ""}
            url={data.file.url}
            hideThumbnail
          />
        )}
      </div>
    </div>
  )
}

const NotificationsEmptyState = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <BellAlertDone />
      <Text size="small" leading="compact" weight="plus" className="mt-3">
        No notifications
      </Text>
      <Text
        size="small"
        className="text-ui-fg-muted mt-1 max-w-[294px] text-center"
      >
        You don't have any notifications at the moment, but once you do they
        will live here.
      </Text>
    </div>
  )
}

const useUnreadNotifications = () => {
  const [hasUnread, setHasUnread] = useState(false)
  const { data } = useQuery({
    queryKey: notificationQueryKeys.list({ limit: 1 }),
    queryFn: () =>
      fetchNotifications({ limit: 1, offset: 0, fields: "created_at" }),
    refetchInterval: 60_000,
  })
  const lastNotification = data?.notifications[0]

  useEffect(() => {
    if (!lastNotification) {
      return
    }

    const lastReadDatetime = localStorage.getItem(LAST_READ_NOTIFICATION_KEY)
    const lastReadAsTimestamp = lastReadDatetime
      ? Date.parse(lastReadDatetime)
      : 0

    if (Date.parse(lastNotification.created_at) > lastReadAsTimestamp) {
      setHasUnread(true)
    }
  }, [lastNotification])

  return [hasUnread, setHasUnread] as const
}

export const config = defineWidgetConfig({ zone: "topbar.after" })

export default Notifications
