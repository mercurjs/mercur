import { Button, Drawer } from "@medusajs/ui";

export const SellerEditSection = ({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) => {
    return (
        <Drawer
          open={open}
          onOpenChange={(openChanged) => setOpen(openChanged)}
        >
            <Drawer.Trigger
                onClick={() => setOpen(true)
                }
                asChild
            >
                <div>Edit</div>
            </Drawer.Trigger>
        </Drawer>
    )
}