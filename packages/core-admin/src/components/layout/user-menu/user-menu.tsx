import {
  BookOpen,
  CircleHalfSolid,
  EllipsisHorizontal,
  Keyboard,
  OpenRectArrowOut,
  TimelineVertical,
  User as UserIcon,
  XMark,
} from "@medusajs/icons"
import {
  Avatar,
  DropdownMenu,
  Heading,
  IconButton,
  Input,
  Kbd,
  Text,
  clx,
} from "@medusajs/ui"
import { Dialog as RadixDialog } from "radix-ui"
import { useTranslation } from "react-i18next"

import { Skeleton } from "../../common/skeleton"

import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useLogout, useMe } from "../../../hooks/api"
import { queryClient } from "../../../lib/query-client"
import { useGlobalShortcuts } from "../../../providers/keybind-provider/hooks"
import { useTheme } from "../../../providers/theme-provider"
import { useDocumentDirection } from "../../../hooks/use-document-direction"

export const UserMenu = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const direction = useDocumentDirection()

  const [openMenu, setOpenMenu] = useState(false)
  const [openModal, setOpenModal] = useState(false)

  const toggleModal = () => {
    setOpenMenu(false)
    setOpenModal(!openModal)
  }

  return (
    <div data-testid="sidebar-user-menu">
      <DropdownMenu dir={direction} open={openMenu} onOpenChange={setOpenMenu} data-testid="sidebar-user-menu-dropdown">
        <UserBadge />
        <DropdownMenu.Content className="min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-trigger-width)]" data-testid="sidebar-user-menu-content">
          <UserItem />
          <DropdownMenu.Separator data-testid="sidebar-user-menu-separator-1" />
          <DropdownMenu.Item asChild data-testid="sidebar-user-menu-profile-settings">
            <Link to="/settings/profile" state={{ from: location.pathname }}>
              <UserIcon className="text-ui-fg-subtle me-2" />
              {t("app.menus.user.profileSettings")}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator data-testid="sidebar-user-menu-separator-2" />
          <DropdownMenu.Item asChild data-testid="sidebar-user-menu-documentation">
            <Link to="https://docs.medusajs.com" target="_blank">
              <BookOpen className="text-ui-fg-subtle me-2" />
              {t("app.menus.user.documentation")}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild data-testid="sidebar-user-menu-changelog">
            <Link to="https://medusajs.com/changelog/" target="_blank">
              <TimelineVertical className="text-ui-fg-subtle me-2" />
              {t("app.menus.user.changelog")}
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator data-testid="sidebar-user-menu-separator-3" />
          <DropdownMenu.Item onClick={toggleModal} data-testid="sidebar-user-menu-shortcuts">
            <Keyboard className="text-ui-fg-subtle me-2" />
            {t("app.menus.user.shortcuts")}
          </DropdownMenu.Item>
          <ThemeToggle />
          <DropdownMenu.Separator data-testid="sidebar-user-menu-separator-4" />
          <Logout />
        </DropdownMenu.Content>
      </DropdownMenu>
      <GlobalKeybindsModal open={openModal} onOpenChange={setOpenModal} />
    </div>
  )
}

const UserBadge = () => {
  const { user, isPending, isError, error } = useMe()

  const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ")
  const displayName = name || user?.email

  const fallback = displayName ? displayName[0].toUpperCase() : null

  if (isPending) {
    return (
      <button className="shadow-borders-base flex max-w-[192px] select-none items-center gap-x-2 overflow-hidden text-ellipsis whitespace-nowrap rounded-full py-1 ps-1 pe-2.5">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-[9px] w-[70px]" />
      </button>
    )
  }

  if (isError) {
    throw error
  }

  return (
    <div className="p-3" data-testid="sidebar-user-menu-badge">
      <DropdownMenu.Trigger
        disabled={!user}
        className={clx(
          "bg-ui-bg-subtle grid w-full cursor-pointer grid-cols-[24px_1fr_15px] items-center gap-2 rounded-md py-1 ps-0.5 pe-2 outline-none",
          "hover:bg-ui-bg-subtle-hover",
          "data-[state=open]:bg-ui-bg-subtle-hover",
          "focus-visible:shadow-borders-focus"
        )}
        data-testid="sidebar-user-menu-trigger"
      >
        <div className="flex size-6 items-center justify-center" data-testid="sidebar-user-menu-avatar-container">
          {fallback ? (
            <Avatar size="xsmall" fallback={fallback} data-testid="sidebar-user-menu-avatar" />
          ) : (
            <Skeleton className="h-6 w-6 rounded-full" />
          )}
        </div>
        <div className="flex items-center overflow-hidden" data-testid="sidebar-user-menu-name-container">
          {displayName ? (
            <Text
              size="xsmall"
              weight="plus"
              leading="compact"
              className="truncate"
              data-testid="sidebar-user-menu-name"
            >
              {displayName}
            </Text>
          ) : (
            <Skeleton className="h-[9px] w-[70px]" />
          )}
        </div>
        <EllipsisHorizontal className="text-ui-fg-muted" />
      </DropdownMenu.Trigger>
    </div>
  )
}

const ThemeToggle = () => {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu.SubMenu data-testid="sidebar-user-menu-theme-toggle">
      <DropdownMenu.SubMenuTrigger dir="ltr" className="rounded-md rtl:rotate-180" data-testid="sidebar-user-menu-theme-trigger">
        <CircleHalfSolid className="text-ui-fg-subtle me-2" />
        <span className="rtl:rotate-180">{t("app.menus.user.theme.label")}</span>
      </DropdownMenu.SubMenuTrigger>
      <DropdownMenu.SubMenuContent data-testid="sidebar-user-menu-theme-content">
        <DropdownMenu.RadioGroup value={theme} data-testid="sidebar-user-menu-theme-radio-group">
          <DropdownMenu.RadioItem
            value="system"
            onClick={(e) => {
              e.preventDefault()
              setTheme("system")
            }}
            data-testid="sidebar-user-menu-theme-system"
          >
            {t("app.menus.user.theme.system")}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem
            value="light"
            onClick={(e) => {
              e.preventDefault()
              setTheme("light")
            }}
            data-testid="sidebar-user-menu-theme-light"
          >
            {t("app.menus.user.theme.light")}
          </DropdownMenu.RadioItem>
          <DropdownMenu.RadioItem
            value="dark"
            onClick={(e) => {
              e.preventDefault()
              setTheme("dark")
            }}
            data-testid="sidebar-user-menu-theme-dark"
          >
            {t("app.menus.user.theme.dark")}
          </DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
      </DropdownMenu.SubMenuContent>
    </DropdownMenu.SubMenu>
  )
}

const Logout = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { mutateAsync: logoutMutation } = useLogout()

  const handleLogout = async () => {
    await logoutMutation(undefined, {
      onSuccess: () => {
        /**
         * When the user logs out, we want to clear the query cache
         */
        queryClient.clear()
        navigate("/login")
      },
    })
  }

  return (
    <DropdownMenu.Item onClick={handleLogout} data-testid="sidebar-user-menu-logout">
      <div className="flex items-center gap-x-2">
        <OpenRectArrowOut className="text-ui-fg-subtle" />
        <span>{t("app.menus.actions.logout")}</span>
      </div>
    </DropdownMenu.Item>
  )
}

const GlobalKeybindsModal = (props: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const { t } = useTranslation()
  const globalShortcuts = useGlobalShortcuts()

  const [searchValue, onSearchValueChange] = useState("")

  const searchResults = searchValue
    ? globalShortcuts.filter((shortcut) => {
        return shortcut.label.toLowerCase().includes(searchValue?.toLowerCase())
      })
    : globalShortcuts

  return (
    <RadixDialog.Root {...props} data-testid="shortcuts-modal">
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="bg-ui-bg-overlay fixed inset-0" data-testid="shortcuts-modal-overlay" />
        <RadixDialog.Content className="bg-ui-bg-subtle shadow-elevation-modal fixed left-[50%] top-[50%] flex h-full max-h-[612px] w-full max-w-[560px] translate-x-[-50%] translate-y-[-50%] flex-col divide-y overflow-hidden rounded-lg" data-testid="shortcuts-modal-content">
          <div className="flex flex-col gap-y-3 px-6 py-4" data-testid="shortcuts-modal-header">
            <div className="flex items-center justify-between" data-testid="shortcuts-modal-header-top">
              <div data-testid="shortcuts-modal-title-container">
                <RadixDialog.Title asChild>
                  <Heading data-testid="shortcuts-modal-title">{t("app.menus.user.shortcuts")}</Heading>
                </RadixDialog.Title>
                <RadixDialog.Description className="sr-only" data-testid="shortcuts-modal-description"></RadixDialog.Description>
              </div>
              <div className="flex items-center gap-x-2" data-testid="shortcuts-modal-close-container">
                <Kbd data-testid="shortcuts-modal-close-hint">esc</Kbd>
                <RadixDialog.Close asChild>
                  <IconButton variant="transparent" size="small" data-testid="shortcuts-modal-close-button">
                    <XMark />
                  </IconButton>
                </RadixDialog.Close>
              </div>
            </div>
            <div data-testid="shortcuts-modal-search-container">
              <Input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchValueChange(e.target.value)}
                data-testid="shortcuts-modal-search"
              />
            </div>
          </div>
          <div className="flex flex-col divide-y overflow-y-auto" data-testid="shortcuts-modal-list">
            {searchResults.map((shortcut, index) => {
              return (
                <div
                  key={index}
                  className="text-ui-fg-subtle flex items-center justify-between px-6 py-3"
                  data-testid={`shortcut-item-${shortcut.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <Text size="small" data-testid={`shortcut-item-${shortcut.label.toLowerCase().replace(/\s/g, '-')}-label`}>{shortcut.label}</Text>
                  <div className="flex items-center gap-x-1" data-testid={`shortcut-item-${shortcut.label.toLowerCase().replace(/\s/g, '-')}-keys`}>
                    {shortcut.keys.Mac?.map((key, index) => {
                      return (
                        <div className="flex items-center gap-x-1" key={index} data-testid={`shortcut-item-${shortcut.label.toLowerCase().replace(/\s/g, '-')}-key-${index}`}>
                          <Kbd data-testid={`shortcut-item-${shortcut.label.toLowerCase().replace(/\s/g, '-')}-kbd-${index}`}>{key}</Kbd>
                          {index < (shortcut.keys.Mac?.length || 0) - 1 && (
                            <span className="txt-compact-xsmall text-ui-fg-subtle" data-testid={`shortcut-item-${shortcut.label.toLowerCase().replace(/\s/g, '-')}-separator-${index}`}>
                              {t("app.keyboardShortcuts.then")}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}

const UserItem = () => {
  const { user, isPending, isError, error } = useMe()

  const loaded = !isPending && !!user

  if (!loaded) {
    return <div></div>
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ")
  const email = user.email
  const fallback = name ? name[0].toUpperCase() : email[0].toUpperCase()
  const avatar = user.avatar_url

  if (isError) {
    throw error
  }

  return (
    <div className="flex items-center gap-x-3 overflow-hidden px-2 py-1" data-testid="sidebar-user-menu-item">
      <Avatar
        size="small"
        variant="rounded"
        src={avatar || undefined}
        fallback={fallback}
        data-testid="sidebar-user-menu-item-avatar"
      />
      <div className="block w-full min-w-0 max-w-[187px] overflow-hidden whitespace-nowrap" data-testid="sidebar-user-menu-item-details">
        <Text
          size="small"
          weight="plus"
          leading="compact"
          className="overflow-hidden text-ellipsis whitespace-nowrap"
          data-testid="sidebar-user-menu-item-name"
        >
          {name || email}
        </Text>
        {!!name && (
          <Text
            size="xsmall"
            leading="compact"
            className="text-ui-fg-subtle overflow-hidden text-ellipsis whitespace-nowrap"
            data-testid="sidebar-user-menu-item-email"
          >
            {email}
          </Text>
        )}
      </div>
    </div>
  )
}
