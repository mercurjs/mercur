import { PencilSquare, Trash } from "@medusajs/icons"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteReservationItem } from "../../../../../hooks/api/reservations"
import { usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ExtendedReservationItem } from "../../../../inventory/inventory-detail/components/reservations-table/use-reservation-list-table-columns"
import { toast } from "@medusajs/ui"

export const ReservationActions = ({
  reservation,
}: {
  reservation: ExtendedReservationItem
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteReservationItem(reservation.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("reservations.deleteWarning"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("inventory.reservation.deleteSuccessToast"))
      },
      onError: (e) => {
        toast.error(e.message)
      },
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              label: t("actions.edit"),
              to: `${reservation.id}/edit`,
              icon: <PencilSquare />,
            },
          ],
        },
        {
          actions: [
            {
              label: t("actions.delete"),
              onClick: handleDelete,
              icon: <Trash />,
            },
          ],
        },
      ]}
    />
  )
}
