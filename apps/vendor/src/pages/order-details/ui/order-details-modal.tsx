import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
  Skeleton,
  Thumbnail,
  Typography
} from '@/shared/ui'
import { VendorOrderDetails } from '@mercurjs/http-client/types'
import { ChevronLeft, Send, Check } from 'lucide-react'
import { ReactNode, useMemo } from 'react'
import { formatAddress } from '@/shared/lib/address'
import { formatDate, formatMoney } from '@/shared/lib'
import { OrderStatusBadge } from '@/entities/order'

type OrderDetailsModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: VendorOrderDetails
  isLoading?: boolean
  actions?: ReactNode
}

export const OrderDetailsModal = ({
  open,
  onOpenChange,
  order,
  isLoading,
  actions
}: OrderDetailsModalProps) => {
  const dialogContent = useMemo(() => {
    if (isLoading) {
      return (
        <>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-6 h-[750px]">
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
          <DialogFooter className="justify-start">
            <Skeleton className="h-8 w-24" />
          </DialogFooter>
        </>
      )
    }

    if (order) {
      return (
        <>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground"
                  onClick={() => onOpenChange(false)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <DialogTitle>Order #{order.display_id}</DialogTitle>
                <OrderStatusBadge paymentStatus={order.payment_status} />
              </div>
              {actions}
            </div>
          </DialogHeader>
          <Separator />
          <div className="flex flex-col gap-6 overflow-auto h-[750px]">
            <OrderDetailsHeader order={order} />
            <Separator />
            <OrderDetailsTotals order={order} />
            <Separator />
            <OrderDetailsAddress order={order} />
            <Separator />
            <OrderDetailsProducts order={order} />
            <Separator />
            <OrderDetailsTimeLine order={order} />
          </div>
          <Separator />
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </>
      )
    }
  }, [actions, isLoading, onOpenChange, order])

  if (!order && !isLoading) {
    throw new Error('No order found')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[580px]">{dialogContent}</DialogContent>
    </Dialog>
  )
}

export const OrderDetailsHeader = ({
  order
}: {
  order: VendorOrderDetails
}) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Typography size="xlarge" weight="plus">
          {order.shipping_address?.first_name}{' '}
          {order.shipping_address?.last_name}
        </Typography>
        <Badge variant="outline" className="text-muted-foreground">
          Customer
        </Badge>
      </div>
      <Typography className="text-muted-foreground">{order.email}</Typography>
    </div>
  )
}

export const OrderDetailsTotals = ({
  order
}: {
  order: VendorOrderDetails
}) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="gap-1 flex flex-col">
        <Typography className="text-muted-foreground">Date</Typography>
        <Typography weight="plus">{formatDate(order.created_at!)}</Typography>
      </div>
      <div className="gap-1 flex flex-col">
        <Typography className="text-muted-foreground">Comission</Typography>
        <Typography weight="plus">
          {/* TODO: fix comission rate */}
          {formatMoney(order.total! * 0.1, order.currency_code!)}
        </Typography>
      </div>
      <div className="gap-1 flex flex-col">
        <Typography className="text-muted-foreground">Total</Typography>
        <Typography weight="plus">
          {formatMoney(order.total!, order.currency_code!)}
        </Typography>
      </div>
    </div>
  )
}

export const OrderDetailsAddress = ({
  order
}: {
  order: VendorOrderDetails
}) => {
  return (
    <div className="flex flex-col gap-5">
      <Typography weight="plus" size="base">
        Address
      </Typography>
      <div className="grid grid-cols-3 gap-4">
        <div className="gap-1 flex flex-col">
          <Typography className="text-muted-foreground">Contact</Typography>
          <Typography weight="plus">
            {order.shipping_address?.first_name}{' '}
            {order.shipping_address?.last_name} {order.shipping_address?.phone}
          </Typography>
        </div>
        <div className="gap-1 flex flex-col">
          <Typography className="text-muted-foreground">Shipping</Typography>
          <Typography weight="plus">
            {formatAddress(order.shipping_address!)}
          </Typography>
        </div>
        <div className="gap-1 flex flex-col">
          <Typography className="text-muted-foreground">Billing</Typography>
          <Typography weight="plus">
            {order.billing_address
              ? formatAddress(order.billing_address!)
              : 'Same as shipping'}
          </Typography>
        </div>
      </div>
    </div>
  )
}

export const OrderDetailsProducts = ({
  order
}: {
  order: VendorOrderDetails
}) => {
  return (
    <div className="flex flex-col gap-5">
      <Typography weight="plus" size="base">
        Products
      </Typography>
      <div className="flex flex-col gap-4">
        {order.items?.map((item) => (
          <div className="flex items-center gap-2">
            <Thumbnail src={item.thumbnail} />
            <div className="flex flex-col gap-1">
              <Typography weight="plus">{item.product_title}</Typography>
              <div className="flex gap-2 text-muted-foreground items-center">
                <Typography size="xsmall">{item.title}</Typography>
                <span className="text-muted-foreground border-r h-4" />
                <Typography size="xsmall">Quantity: {item.quantity}</Typography>
                <span className="text-muted-foreground border-r h-4" />
                <Typography size="xsmall">
                  {formatMoney(item.unit_price!, order.currency_code!)}
                </Typography>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const OrderDetailsTimeLine = ({
  order
}: {
  order: VendorOrderDetails
}) => {
  const events = useMemo(() => {
    const baseEvents = [
      {
        title: 'Order created',
        date: order.created_at,
        details: order.email,
        icon: <Send className="h-5 w-5 text-muted-foreground mt-1" />
      }
    ]

    if (order.payment_status === 'captured') {
      baseEvents.push({
        title: 'Order paid',
        date: order.created_at,
        details: order.email,
        icon: (
          <div className="rounded-full w-5 h-5 flex items-center justify-center bg-success mt-1">
            <Check className="size-3 text-white" />
          </div>
        )
      })
    }

    return baseEvents
  }, [order])

  return (
    <div className="flex flex-col gap-5">
      <Typography weight="plus" size="base">
        Timeline
      </Typography>
      <div className="space-y-4">
        {events?.reverse().map((event, i) => (
          <div key={i} className="flex gap-3 pb-2">
            {event.icon}
            <div className="flex-1">
              <div className="flex justify-between gap-1">
                <Typography weight="plus">{event.title}</Typography>
                <Typography size="xsmall" className="text-muted-foreground">
                  {formatDate(event.date!)}
                </Typography>
              </div>
              <Typography className="text-muted-foreground" size="xsmall">
                {event.details}
              </Typography>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
