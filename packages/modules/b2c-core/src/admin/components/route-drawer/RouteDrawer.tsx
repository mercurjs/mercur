import { Drawer } from "@medusajs/ui"

export const RouteDrawer = ({ 
  children, 
  onClose, 
  header = '' 
}: { 
  children: React.ReactNode, 
  onClose: (open: boolean) => void, 
  header?: string 
}) => {
  return (
    <Drawer open={true} onOpenChange={onClose}>
      <Drawer.Content className="!w-1/3 !right-0">
        <Drawer.Header>
          <Drawer.Title>{header}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="overflow-y-auto h-full">
          <div className="flex flex-col gap-4 px-4">
            {children}
          </div>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}