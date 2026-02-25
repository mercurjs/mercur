import {
  BellAlert,
  BellAlertDone,
  InformationCircleSolid,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, Drawer, Heading, IconButton, Text } from "@medusajs/ui"
import { formatDistance } from "date-fns"
import { TFunction } from "i18next"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { notificationQueryKeys, useNotifications } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { FilePreview } from "../../common/file-preview"
import { InfiniteList } from "../../common/infinite-list"

interface NotificationData {
  title: string
  description?: string
  file?: {
    filename?: string
    url?: string
    mimeType?: string
  }
}

const LAST_READ_NOTIFICATION_KEY = "notificationsLastReadAt"

export const Notifications = () => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useUnreadNotifications()
  // This is used to show the unread icon on the notification when the drawer is open,
  // so it should lag behind the local storage data and should only be reset on close
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
    <Drawer open={open} onOpenChange={handleOnOpen} data-testid="notifications-drawer">
      <Drawer.Trigger asChild>
        <IconButton
          variant="transparent"
          size="small"
          className="text-ui-fg-muted hover:text-ui-fg-subtle"
          data-testid="notifications-trigger-button"
        >
          {hasUnread ? <BellAlertDone data-testid="notifications-icon-unread" /> : <BellAlert data-testid="notifications-icon" />}
        </IconButton>
      </Drawer.Trigger>
      <Drawer.Content data-testid="notifications-content">
        <Drawer.Header data-testid="notifications-header">
          <Drawer.Title asChild>
            <Heading data-testid="notifications-title">{t("notifications.domain")}</Heading>
          </Drawer.Title>
          <Drawer.Description className="sr-only" data-testid="notifications-description">
            {t("notifications.accessibility.description")}
          </Drawer.Description>
        </Drawer.Header>
        <Drawer.Body className="overflow-y-auto px-0" data-testid="notifications-body">
          <div data-testid="notifications-list">
            <InfiniteList<
              HttpTypes.AdminNotificationListResponse,
              HttpTypes.AdminNotification,
              HttpTypes.AdminNotificationListParams
            >
              responseKey="notifications"
              queryKey={notificationQueryKeys.all}
              queryFn={(params) => sdk.admin.notification.list(params)}
              queryOptions={{ enabled: open }}
              renderEmpty={() => <NotificationsEmptyState t={t} />}
              renderItem={(notification) => {
                return (
                  <Notification
                    key={notification.id}
                    notification={notification}
                    unread={
                      Date.parse(notification.created_at) >
                      (lastReadAt ? Date.parse(lastReadAt) : 0)
                    }
                  />
                )
              }}
            />
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

const Notification = ({
  notification,
  unread,
}: {
  notification: HttpTypes.AdminNotification
  unread?: boolean
}) => {
  const data = notification.data as unknown as NotificationData | undefined

  // We need at least the title to render a notification in the feed
  if (!data?.title) {
    return null
  }

  return (
    <>
      <div className="relative flex items-start justify-center gap-3 border-b p-6" data-testid={`notification-${notification.id}`}>
        <div className="text-ui-fg-muted flex size-5 items-center justify-center" data-testid={`notification-${notification.id}-icon`}>
          <InformationCircleSolid />
        </div>
        <div className="flex w-full flex-col gap-y-3" data-testid={`notification-${notification.id}-content`}>
          <div className="flex flex-col" data-testid={`notification-${notification.id}-header`}>
            <div className="flex items-center justify-between">
              <Text size="small" leading="compact" weight="plus" data-testid={`notification-${notification.id}-title`}>
                {data.title}
              </Text>
              <div className="align-center flex items-center justify-center gap-2" data-testid={`notification-${notification.id}-meta`}>
                <Text
                  as={"span"}
                  className={clx("text-ui-fg-subtle", {
                    "text-ui-fg-base": unread,
                  })}
                  size="small"
                  leading="compact"
                  weight="plus"
                  data-testid={`notification-${notification.id}-time`}
                >
                  {formatDistance(notification.created_at, new Date(), {
                    addSuffix: true,
                  })}
                </Text>
                {unread && (
                  <div
                    className="bg-ui-bg-interactive h-2 w-2 rounded"
                    role="status"
                    data-testid={`notification-${notification.id}-unread-indicator`}
                  />
                )}
              </div>
            </div>
            {!!data.description && (
              <Text
                className="text-ui-fg-subtle whitespace-pre-line"
                size="small"
                data-testid={`notification-${notification.id}-description`}
              >
                {data.description}
              </Text>
            )}
          </div>
          {!!data?.file?.url && (
            <FilePreview
              filename={data.file.filename ?? ""}
              url={data.file.url}
              hideThumbnail
              data-testid={`notification-${notification.id}-file`}
            />
          )}
        </div>
      </div>
    </>
  )
}

const NotificationsEmptyState = ({ t }: { t: TFunction }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center" data-testid="notifications-empty-state">
      <BellAlertDone data-testid="notifications-empty-icon" />
      <Text size="small" leading="compact" weight="plus" className="mt-3" data-testid="notifications-empty-title">
        {t("notifications.emptyState.title")}
      </Text>
      <Text
        size="small"
        className="text-ui-fg-muted mt-1 max-w-[294px] text-center"
        data-testid="notifications-empty-description"
      >
        {t("notifications.emptyState.description")}
      </Text>
    </div>
  )
}

const useUnreadNotifications = () => {
  const [hasUnread, setHasUnread] = useState(false)
  const { notifications } = useNotifications(
    { limit: 1, offset: 0, fields: "created_at" },
    { refetchInterval: 60_000 }
  )
  const lastNotification = notifications?.[0]

  useEffect(() => {
    if (!lastNotification) {
      return
    }

    const lastNotificationAsTimestamp = Date.parse(lastNotification.created_at)

    const lastReadDatetime = localStorage.getItem(LAST_READ_NOTIFICATION_KEY)
    const lastReadAsTimestamp = lastReadDatetime
      ? Date.parse(lastReadDatetime)
      : 0

    if (lastNotificationAsTimestamp > lastReadAsTimestamp) {
      setHasUnread(true)
    }
  }, [lastNotification])

  return [hasUnread, setHasUnread] as const
}
