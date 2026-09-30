import { Text } from "@medusajs/ui"
import { AdminOrderChange } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { useCustomer } from "@hooks/api"
import { useCan } from "@mercurjs/dashboard-shared"

type TransferOrderRequestBodyProps = {
  transfer: AdminOrderChange
}

export const TransferOrderRequestBody = ({
  transfer,
}: TransferOrderRequestBodyProps) => {
  const { t } = useTranslation()

  const action = transfer.actions[0]
  const canViewCustomer = useCan("customers")
  const { customer } = useCustomer(action.reference_id, undefined, {
    enabled: canViewCustomer,
  })

  return (
    <div>
      <Text size="small" className="text-ui-fg-subtle">
        {t("orders.activity.from")}: {String(action.details?.original_email || "")}
      </Text>

      <Text size="small" className="text-ui-fg-subtle">
        {t("orders.activity.to")}:{" "}
        {!canViewCustomer
          ? action.reference_id
          : customer?.first_name
            ? `${customer?.first_name} ${customer?.last_name}`
            : customer?.email}
      </Text>
    </div>
  )
}
