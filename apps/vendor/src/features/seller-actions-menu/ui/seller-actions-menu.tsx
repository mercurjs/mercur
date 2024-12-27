import {
  Avatar,
  AvatarFallback,
  DropdownMenuItem,
  Typography
} from '@/shared/ui'

import { LogOut, EllipsisVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/shared/ui'
import { useLogout } from '@/shared/hooks/api'
import { navigate } from 'wouter/use-browser-location'

export const SellerActionsMenu = () => {
  const { mutateAsync: logout } = useLogout()
  const onLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex items-center gap-4"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Avatar className="size-8">
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <Typography size="small" weight="plus">
                  Seller
                </Typography>
                <Typography size="xsmall" className="text-muted-foreground">
                  Mercur
                </Typography>
              </div>
              <EllipsisVertical className="ml-auto text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={'right'}
            sideOffset={4}
          >
            <DropdownMenuItem className="gap-2 p-2" onClick={onLogout}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <LogOut className="size-4" />
              </div>
              <Typography
                size="small"
                weight="plus"
                className="text-muted-foreground"
              >
                Logout
              </Typography>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
