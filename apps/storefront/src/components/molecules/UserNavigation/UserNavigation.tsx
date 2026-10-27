"use client"
import { Badge } from '@/components/atoms/Badge/Badge';
import { Card } from '@/components/atoms/Card/Card';
import { Divider } from '@/components/atoms/Divider/Divider';
import { LogoutButton } from '@/components/atoms/LogoutButton/LogoutButton';
import { NavigationItem } from '@/components/atoms/NavigationItem/NavigationItem';
import { useUnreads } from "@talkjs/react"
import { usePathname } from "next/navigation"

const navigationItems = [
  {
    label: "Orders",
    href: "/user/orders",
  },
  // {
  //   label: "Messages",
  //   href: "/user/messages",
  // },
  // {
  //   label: "Returns",
  //   href: "/user/returns",
  // },
  {
    label: "Addresses",
    href: "/user/addresses",
  },
]

export const UserNavigation = () => {
  const unreads = useUnreads()
  const path = usePathname()

  return (
    <Card className="h-min">
      {navigationItems.map((item) => (
        <NavigationItem
          key={item.label}
          href={item.href}
          active={path === item.href}
          className="relative"
        >
          {item.label}
          {item.label === "Messages" && Boolean(unreads?.length) && (
            <Badge className="absolute top-3 left-24 w-4 h-4 p-0">
              {unreads?.length}
            </Badge>
          )}
        </NavigationItem>
      ))}
      <Divider className="my-2" />
      <NavigationItem
        href={"/user/settings"}
        active={path === "/user/settings"}
      >
        Settings
      </NavigationItem>
      <LogoutButton className="w-full text-left" />
    </Card>
  )
}
