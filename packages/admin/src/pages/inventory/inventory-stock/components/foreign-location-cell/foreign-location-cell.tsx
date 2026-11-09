import { Switch, Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { DataGridReadOnlyCell } from "../../../../../components/data-grid/components"
import { DataGridCellProps } from "../../../../../components/data-grid/types"

export const ForeignLocationCell = <TData, TValue = unknown>({
  context,
}: DataGridCellProps<TData, TValue>) => {
  const { t } = useTranslation()

  return (
    <DataGridReadOnlyCell context={context} color="normal">
      <Tooltip content={t("inventory.stock.foreignStoreTooltip")}>
        <div className="flex w-full items-center justify-between gap-x-2">
          <Switch
            dir="ltr"
            size="small"
            className="shrink-0 rtl:rotate-180"
            checked={false}
            disabled
          />
          <span className="text-ui-fg-muted">
            {t("inventory.stock.placeholder")}
          </span>
        </div>
      </Tooltip>
    </DataGridReadOnlyCell>
  )
}
