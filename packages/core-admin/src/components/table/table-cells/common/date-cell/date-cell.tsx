import { Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { PlaceholderCell } from "../placeholder-cell"
import { useDate } from "../../../../../hooks/use-date"

type DateCellProps = {
  date?: Date | string | null
  "data-testid"?: string
}

export const DateCell = ({ date, "data-testid": dataTestId }: DateCellProps) => {
  const { getFullDate } = useDate()

  if (!date) {
    return <PlaceholderCell />
  }

  return (
    <div className="flex h-full w-full items-center overflow-hidden" data-testid={dataTestId}>
      <Tooltip
        className="z-10"
        content={
          <span className="text-pretty">{`${getFullDate({
            date,
            includeTime: true,
          })}`}</span>
        }
      >
        <span className="truncate" data-testid={dataTestId ? `${dataTestId}-text` : undefined}>
          {getFullDate({ date, includeTime: false })}
        </span>
      </Tooltip>
    </div>
  )
}

export const DateHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full items-center" data-testid="data-table-header-date">
      <span className="truncate" data-testid="data-table-header-date-text">{t("fields.date")}</span>
    </div>
  )
}
