import { OrderTable } from '@/entities/order'
import { Text } from '@/shared/ui'

export default function OrdersPage() {
  return (
    <>
      <Text size="2xlarge" weight="plus">
        Orders
      </Text>
      <OrderTable />
    </>
  )
}
