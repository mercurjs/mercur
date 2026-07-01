// OrderTimeline.tsx
import { cn } from "@/lib/utils"

type OrderStatus = "received" | "preparing" | "shipped" | "delivered"

interface OrderTimelineProps {
  currentStatus: OrderStatus
}

export const OrderTimeline = ({ currentStatus }: OrderTimelineProps) => {
  const statuses: OrderStatus[] = [
    "received",
    "preparing",
    "shipped",
    "delivered",
  ]
  const currentIndex = statuses.findIndex((status) => status === currentStatus)

  return (
    <div className="w-full pt-6 pb-4">
      <div className="relative flex items-center justify-around">
        {/* Base line */}
        <div className="absolute left-0 right-0 h-0.5 bg-[#EEEEEE]" />

        {/* Progress line */}
        <div
          className="absolute left-0 h-0.5 bg-[#1B1B1B] transition-all duration-300"
          style={{
            width:
              currentIndex >= 0
                ? `calc(${(currentIndex / statuses.length) * 100}% + 105px)`
                : "0%",
          }}
        />

        {/* Status points */}
        {statuses.map((status, index) => {
          const isActive = index <= currentIndex

          return (
            <div
              key={status}
              className="absolute flex flex-col items-center z-10"
              style={{
                left: `calc(${(index / statuses.length) * 100}% + 70px)`,
              }}
            >
              <span
                className={cn(
                  "heading-xs text-primary -translate-y-4 uppercase whitespace-nowrap",
                  isActive ? "text-[#1B1B1B]" : "text-[#EEEEEE]"
                )}
              >
                {status}
              </span>
              <div
                className={cn(
                  "size-2.5 rounded-full transition-colors duration-300 -translate-y-2.5",
                  isActive ? "bg-[#1B1B1B]" : "bg-[#EEEEEE]"
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
