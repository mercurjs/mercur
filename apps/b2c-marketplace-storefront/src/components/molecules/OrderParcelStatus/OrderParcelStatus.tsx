import { StepProgressBar } from "@/components/cells/StepProgressBar/StepProgressBar"
import { parcelStatuses, steps } from "@/lib/helpers/parcel-statuses"

export const OrderParcelStatus = ({ order }: { order: any }) => {
  let currentStep = parcelStatuses(order.fulfillment_status)

  return (
    <div>
      <StepProgressBar steps={steps} currentStep={currentStep} />
    </div>
  )
}
