import { Text, clx } from "@medusajs/ui"
import type { ReactNode } from "react"

export type SectionRowProps = {
  title: string
  value?: ReactNode | string | null
  actions?: ReactNode
  "data-testid"?: string
}

export const SectionRow = ({ title, value, actions, "data-testid": dataTestId }: SectionRowProps) => {
  const isValueString = typeof value === "string" || !value

  return (
    <div
      className={clx(
        `text-ui-fg-subtle grid w-full grid-cols-2 items-center gap-4 px-6 py-4`,
        {
          "grid-cols-[1fr_1fr_28px]": !!actions,
        }
      )}
      data-testid={dataTestId}
    >
      <Text 
        size="small" 
        weight="plus" 
        leading="compact"
        data-testid={dataTestId ? `${dataTestId}-title` : undefined}
      >
        {title}
      </Text>

      {isValueString ? (
        <Text
          size="small"
          leading="compact"
          className="whitespace-pre-line text-pretty"
          data-testid={dataTestId ? `${dataTestId}-value` : undefined}
        >
          {value ?? "-"}
        </Text>
      ) : (
        <div 
          className="flex flex-wrap gap-1"
          data-testid={dataTestId ? `${dataTestId}-value` : undefined}
        >
          {value}
        </div>
      )}

      {actions && <div data-testid={dataTestId ? `${dataTestId}-actions` : undefined}>{actions}</div>}
    </div>
  )
}
