import {
  formatDeliveryEstimate,
  type DeliveryEstimate as DeliveryEstimateValue,
} from "@/lib/helpers/delivery-estimate"
import { cn } from "@/lib/utils"

export const DeliveryEstimate = ({
  estimate,
  className,
  "data-testid": dataTestId,
}: {
  estimate: DeliveryEstimateValue | null | undefined
  className?: string
  "data-testid"?: string
}) => {
  const label = formatDeliveryEstimate(estimate)

  if (!label) return null

  return (
    <p
      className={cn("label-sm text-secondary", className)}
      data-testid={dataTestId ?? "delivery-estimate"}
    >
      {label}
    </p>
  )
}
