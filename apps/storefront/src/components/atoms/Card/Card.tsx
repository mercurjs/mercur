import { cn } from "@/lib/utils"

export const Card = ({
  children,
  className,
  "data-testid": dataTestId,
  ...props
}: {
  children: React.ReactNode
  "data-testid"?: string
} & React.ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      className={cn("border rounded-sm py-4 px-2", className)}
      data-testid={dataTestId ?? 'card'}
      {...props}
    >
      {children}
    </div>
  )
}
