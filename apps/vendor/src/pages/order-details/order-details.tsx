import { useOrder } from '@/shared/hooks/api'
import { useToggleState } from '@/shared/hooks'
import { ActionMenu } from '@/shared/ui'
import { useParams } from 'wouter'
import { navigate } from 'wouter/use-browser-location'
import { OrderDetailsModal } from './ui/order-details-modal'

const OrderDetailsPage = () => {
  const { toggle, state } = useToggleState(true)
  const { id } = useParams()
  const { order, isLoading } = useOrder(id!)

  const onOpenChange = (open: boolean) => {
    if (!open) {
      navigate('/dashboard/orders')
    }

    toggle()
  }

  return (
    <OrderDetailsModal
      open={state}
      onOpenChange={onOpenChange}
      order={order}
      isLoading={isLoading}
      actions={<ActionMenu groups={[]} />}
    />
  )
}

export default OrderDetailsPage
