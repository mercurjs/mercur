import { PencilSquare, Trash } from "@medusajs/icons"
import { toast, usePrompt } from "@medusajs/ui"

import { HttpTypes } from "@medusajs/types"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "@components/common/action-menu"
import { useDeleteReservationItem } from "@hooks/api/reservations"

export const ReservationActions = ({
  reservation,
}: {
  reservation: HttpTypes.AdminReservation
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteReservationItem(reservation.id)

  const handleDelete = async () => {
    if (reservation.line_item_id) {
      await prompt({
        title: t("inventory.reservation.deleteTitle"),
        description: t("inventory.reservation.deleteBlockedDescription"),
        confirmText: t("inventory.reservation.gotIt"),
        cancelText: t("actions.cancel"),
      })

      return
    }

    const res = await prompt({
      title: t("inventory.reservation.deleteTitle"),
      description: t("inventory.reservation.deleteDescription"),
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
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/reservations/${reservation.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
      data-testid={`reservation-actions-${reservation.id}`}
    />
  )
}
