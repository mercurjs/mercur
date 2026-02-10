import { Popover, Text } from "@medusajs/ui"
import { ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"

type ChangeDetailsTooltipProps = {
  previous: ReactNode
  next: ReactNode
  title: string
}

function ChangeDetailsTooltip(props: ChangeDetailsTooltipProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const previous = props.previous
  const next = props.next
  const title = props.title

  const handleMouseEnter = () => {
    setOpen(true)
  }

  const handleMouseLeave = () => {
    setOpen(false)
  }

  if (!previous && !next) {
    return null
  }

  return (
    <Popover open={open}>
      <Popover.Trigger
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        autoFocus={false}
        className="focus-visible:outline-none"
      >
        <Text size="small" leading="compact" weight="plus">
          {title}
        </Text>
      </Popover.Trigger>

      <Popover.Content
        align="center"
        side="top"
        className="bg-ui-bg-component max-w-[200px] p-0 focus-visible:outline-none"
      >
        <div className="flex flex-col">
          {!!previous && (
            <div className="p-3">
              <div className="txt-compact-small-plus mb-1">
                {t("labels.from")}
              </div>

              <p className="txt-compact-small text-ui-fg-subtle">{previous}</p>
            </div>
          )}

          {!!next && (
            <div className="border-t-2 border-dotted p-3">
              <div className="txt-compact-small-plus mb-1">
                {t("labels.to")}
              </div>

              <p className="txt-compact-small text-ui-fg-subtle">{next}</p>
            </div>
          )}
        </div>
      </Popover.Content>
    </Popover>
  )
}

export default ChangeDetailsTooltip
