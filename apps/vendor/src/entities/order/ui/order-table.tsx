import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/shared/ui'

const orders = [
  {
    display_id: 123,
    customer: 'John Doe',
    products: ['Product 1', 'Product 2', 'Product 3'],
    status: 'active',
    date: new Date(),
    revenue: 250
  },
  {
    display_id: 123,
    customer: 'John Doe',
    products: ['Product 1', 'Product 2', 'Product 3'],
    status: 'active',
    date: new Date(),
    revenue: 250
  },
  {
    display_id: 123,
    customer: 'John Doe',
    products: ['Product 1', 'Product 2', 'Product 3'],
    status: 'active',
    date: new Date(),
    revenue: 250
  },
  {
    display_id: 123,
    customer: 'John Doe',
    products: ['Product 1', 'Product 2', 'Product 3'],
    status: 'active',
    date: new Date(),
    revenue: 250
  }
]

export const OrderTable = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">#</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Products</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.display_id}>
            <TableCell className="font-medium">{order.display_id}</TableCell>
            <TableCell>{order.customer}</TableCell>
            <TableCell>{order.products.join(', ')}</TableCell>
            <TableCell>{order.status}</TableCell>
            <TableCell>{order.date.toLocaleDateString()}</TableCell>
            <TableCell className="text-right">{order.revenue}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
