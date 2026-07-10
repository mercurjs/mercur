import { cn } from "@/lib/utils"

export const StepProgressBar = ({
  steps,
  currentStep,
}: {
  steps: string[]
  currentStep: number
}) => {
  const length = steps.length || 0

  return (
    <div className={`grid grid-cols-${length} h-16`}>
      {steps.map((step, index) => (
        <div key={step} className="relative">
          <p
            className={cn(
              "text-center label-md text-primary",
              index <= currentStep ? "!font-bold" : "!font-normal"
            )}
          >
            {step}
          </p>
          <div className="absolute bottom-2 left-0 w-full flex items-center justify-center">
            <div
              className={cn(
                "absolute left-0 w-1/2 border-y",
                index <= currentStep ? "border-primary" : ""
              )}
            />
            <div
              className={cn(
                "absolute left-1/2 w-1/2 border-y",
                index + 1 <= currentStep ? "border-primary" : "",
                currentStep === steps.length - 1 ? "border-primary" : ""
              )}
            />
            <div
              className={cn(
                "w-2 h-2 border-2 rounded-full mx-auto z-10 bg-tertiary",
                index <= currentStep
                  ? "bg-tertiary border-primary"
                  : "bg-secondary"
              )}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
