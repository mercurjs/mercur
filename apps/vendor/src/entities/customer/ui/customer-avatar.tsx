import { Avatar, AvatarFallback } from '@/shared/ui'
import { Typography } from '@/shared/ui'

export const CustomerAvatar = ({
  customer
}: {
  customer: { name: string }
}) => {
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-5 w-5">
        <AvatarFallback className="text-xs">
          {customer.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
      <Typography weight="plus" size="xsmall">
        {customer.name}
      </Typography>
    </div>
  )
}
