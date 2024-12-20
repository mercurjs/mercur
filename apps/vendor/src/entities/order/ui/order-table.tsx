import { formatMoney } from '@/shared/lib'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/ui'
import { VendorOrderDetails } from '@mercurjs/http-client/types'
import { OrderStatusBadge } from './order-status-badge'
import { CustomerAvatar } from '@/entities/customer'
import { ActionMenu, Typography } from '@/shared/ui'
import { format } from 'date-fns'

type OrderTableProps = {
  orders: VendorOrderDetails[]
}

export const OrderTable = ({ orders }: OrderTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">
            <Typography weight="plus" size="xsmall">
              #
            </Typography>
          </TableHead>
          <TableHead>
            <Typography weight="plus" size="xsmall">
              Customer
            </Typography>
          </TableHead>
          <TableHead>
            <Typography weight="plus" size="xsmall">
              Products
            </Typography>
          </TableHead>
          <TableHead>
            <Typography weight="plus" size="xsmall">
              Payment Status
            </Typography>
          </TableHead>
          <TableHead>
            <Typography weight="plus" size="xsmall">
              Date
            </Typography>
          </TableHead>
          <TableHead>
            <Typography weight="plus" size="xsmall">
              Revenue
            </Typography>
          </TableHead>
          <TableHead className="text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.display_id} className="cursor-pointer">
            <TableCell>
              <Typography weight="plus" size="small">
                #{order.display_id}
              </Typography>
            </TableCell>
            <TableCell>
              <CustomerAvatar
                customer={{
                  name:
                    order.shipping_address?.first_name ??
                    order.shipping_address?.last_name ??
                    'John Doe'
                }}
              />
            </TableCell>
            <TableCell>
              <Typography size="small" className="text-muted-foreground">
                {order.items?.map((item) => item.product_title).join(', ')}
              </Typography>
            </TableCell>
            <TableCell>
              <OrderStatusBadge />
            </TableCell>
            <TableCell>
              <Typography size="small" className="text-muted-foreground">
                {format(new Date(order.created_at!), 'd MMM, hh:mm a')}
              </Typography>
            </TableCell>
            <TableCell>
              <Typography size="small" className="text-muted-foreground">
                {formatMoney(order.total!, order.currency_code!)}
              </Typography>
            </TableCell>
            <TableCell className="text-right">
              <ActionMenu groups={[]} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
