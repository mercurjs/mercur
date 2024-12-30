import { SellerActionsMenu } from '@/features/seller-actions-menu'
import { cn } from '@/shared/lib'
import {
  Button,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Typography
} from '@/shared/ui'
import { House, Settings } from 'lucide-react'
import { Link, useLocation } from 'wouter'

const items = [
  {
    title: 'Home',
    url: '/orders',
    icon: House
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings
  }
]

export const AppSidebar = () => {
  const [pathname] = useLocation()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHeader>
            <SellerActionsMenu />
          </SidebarHeader>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          'w-full justify-start',
                          pathname === item.url
                            ? 'text-primary bg-accent'
                            : '!text-muted-foreground'
                        )}
                        size="sm"
                      >
                        <span className="size-3.5">
                          <item.icon />
                        </span>
                        <Typography size="small" weight="plus">
                          {item.title}
                        </Typography>
                      </Button>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
