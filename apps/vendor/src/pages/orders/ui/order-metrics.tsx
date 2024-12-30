import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Typography
} from '@/shared/ui'

export const OrderMetrics = () => {
  return (
    <div className="grid grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography size="2xlarge" weight="plus">
            2,560
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography size="2xlarge" weight="plus">
            $2,560
          </Typography>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average order value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Typography size="2xlarge" weight="plus">
            $2,560
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}
