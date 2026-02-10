import { Text } from "@medusajs/ui"
import { AdminOrderChange } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import { countItemsChange } from "../utils/count-items-change"

type OrderEditBodyProps = {
  edit: AdminOrderChange
}

export const OrderEditBody = ({ edit }: OrderEditBodyProps) => {
  const { t } = useTranslation()

  const [itemsAdded, itemsRemoved] = useMemo(
    () => countItemsChange(edit.actions),
    [edit]
  )

  return (
    <div>
      {itemsAdded > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("labels.added")}: {itemsAdded}
        </Text>
      )}

      {itemsRemoved > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("labels.removed")}: {itemsRemoved}
        </Text>
      )}
    </div>
  )
}

