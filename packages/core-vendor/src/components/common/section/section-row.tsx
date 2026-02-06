import { InformationCircleSolid } from "@medusajs/icons"
import { Text, Tooltip, clx } from "@medusajs/ui"
import { ReactNode } from "react"

export type SectionRowProps = {
  title: string
  value?: ReactNode | string | null
  actions?: ReactNode
  tooltip?: string
}

export const SectionRow = ({
  title,
  value,
  actions,
  tooltip,
}: SectionRowProps) => {
  const isValueString = typeof value === "string" || !value

  return (
    <div
      className={clx(
        `text-ui-fg-subtle grid w-full grid-cols-2 items-center gap-4 px-6 py-4`,
        {
          "grid-cols-[1fr_1fr_28px]": !!actions,
        }
      )}
    >
      <Text
        size="small"
        weight="plus"
        leading="compact"
        className="flex items-center gap-x-2"
      >
        {title}
        {tooltip && (
          <Tooltip content={tooltip}>
            <InformationCircleSolid />
          </Tooltip>
        )}
      </Text>

      {isValueString ? (
        <Text
          size="small"
          leading="compact"
          className="whitespace-pre-line text-pretty"
        >
          {value ?? "-"}
        </Text>
      ) : (
        <div className="flex flex-wrap gap-1">{value}</div>
      )}

      {actions && <div>{actions}</div>}
    </div>
  )
}
