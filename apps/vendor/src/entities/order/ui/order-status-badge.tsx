import { Badge } from '@/shared/ui/badge'

type OrderStatusBadgeProps = {
  paymentStatus?: string
}

export const OrderStatusBadge = ({ paymentStatus }: OrderStatusBadgeProps) => {
  switch (paymentStatus) {
    case 'captured':
      return <Badge variant="lime">Paid</Badge>
    case 'canceled':
      return <Badge variant="destructive">Cancelled</Badge>
    case 'refunded':
      return <Badge variant="destructive">Refunded</Badge>
    default:
      return <Badge variant="secondary">Pending</Badge>
  }
}
