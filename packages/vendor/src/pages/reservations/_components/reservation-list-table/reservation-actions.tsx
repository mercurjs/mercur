import { PencilSquare, Trash } from "@medusajs/icons"

import { ActionMenu } from "@components/common/action-menu"
import { useDeleteReservationItem } from "@hooks/api/reservations"
import { toast, usePrompt } from "@medusajs/ui"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ExtendedReservationItem } from "../../../inventory/[id]/_components/reservations-table/use-reservation-list-table-columns"

export const ReservationActions = ({
  reservation,
}: {
  reservation: ExtendedReservationItem
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { mutateAsync } = useDeleteReservationItem(reservation.id)

  // Reservations linked to an unfulfilled order cannot be edited or deleted.
  // A fulfilled order auto-removes its reservation, so a still-present
  // line-item link means the order is unfulfilled.
  const isLocked = !!reservation.line_item_id

  const showLockedPrompt = (title: string, description: string) =>
    prompt({
      title,
      description,
      confirmText: t("inventory.reservation.gotIt"),
      cancelText: t("actions.cancel"),
    })

  const handleEdit = async () => {
    if (isLocked) {
      await showLockedPrompt(
        t("reservations.edit.lockedTitle"),
        t("reservations.edit.lockedDescription")
      )
      return
    }

    navigate(`${reservation.id}/edit`)
  }

  const handleDelete = async () => {
    if (isLocked) {
      await showLockedPrompt(
        t("reservations.delete.lockedTitle"),
        t("reservations.delete.lockedDescription")
      )
      return
    }

    const res = await prompt({
      title: t("reservations.delete.title"),
      description: t("reservations.delete.description"),
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
              onClick: handleEdit,
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
