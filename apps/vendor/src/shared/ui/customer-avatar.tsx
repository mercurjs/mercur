import { Avatar, AvatarFallback } from '@/shared/ui'
import { Typography } from '@/shared/ui'

export const CustomerAvatar = ({
  customer
}: {
  customer: { name?: string }
}) => {
  return (
    <div className="flex items-center gap-2">
      {customer.name && (
        <Avatar className="h-5 w-5">
          <AvatarFallback className="text-xs">
            {customer.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {customer.name ? (
        <Typography weight="plus" size="xsmall">
          {customer.name}
        </Typography>
      ) : (
        <Typography
          weight="plus"
          size="xsmall"
          className="text-muted-foreground"
        >
          -
        </Typography>
      )}
    </div>
  )
}
