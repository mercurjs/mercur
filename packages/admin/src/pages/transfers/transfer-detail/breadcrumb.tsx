import { UIMatch } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useTransfer } from "../../../hooks/api/transfers"
import { getTransferTypeLabel } from "../common/utils"

export const TransferDetailBreadcrumb = (props: UIMatch) => {
  const { t } = useTranslation()
  const { id } = props.params || {}

  const { transfer } = useTransfer(id!, undefined, {
    enabled: Boolean(id),
  })

  if (!transfer) {
    return null
  }

  return <span>{getTransferTypeLabel(transfer.type, t)}</span>
}
