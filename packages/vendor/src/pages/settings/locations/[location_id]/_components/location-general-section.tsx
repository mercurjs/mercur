import { ArchiveBox, PencilSquare, Trash } from "@medusajs/icons"
import { Container, Heading, Text, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "@components/common/action-menu"
import { useDeleteStockLocation } from "@hooks/api/stock-locations"
import { getFormattedAddress } from "@lib/addresses"
import { VendorExtendedAdminStockLocation } from "@custom-types/stock-location"

type LocationGeneralSectionProps = {
  location: VendorExtendedAdminStockLocation
}

export const LocationGeneralSection = ({
  location,
}: LocationGeneralSectionProps) => {
  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{location.name}</Heading>
          <Text className="text-ui-fg-subtle txt-small">
            {getFormattedAddress({
              address: location.address,
            }).join(", ")}
          </Text>
        </div>
        <Actions location={location} />
      </div>
    </Container>
  )
}

const Actions = ({ location }: { location: VendorExtendedAdminStockLocation }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { mutateAsync } = useDeleteStockLocation(location.id)
  const prompt = usePrompt()

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("stockLocations.delete.confirmation", {
        name: location.name,
      }),
      verificationText: location.name,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(
          t("stockLocations.create.successToast", {
            name: location.name,
          })
        )
        navigate("/settings/locations", { replace: true })
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
              permission: "stock_locations:edit",
              label: t("actions.edit"),
              to: `edit`,
            },
            {
              icon: <ArchiveBox />,
              label: t("stockLocations.edit.viewInventory"),
              to: `/inventory?location_id=${location.id}`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              permission: "stock_locations:manage",
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}
