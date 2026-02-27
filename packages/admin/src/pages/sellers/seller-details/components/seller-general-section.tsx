import { CheckCircleSolid, PencilSquare, User, XCircleSolid } from "@medusajs/icons"
import {
  Container,
  Heading,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { InferClientOutput } from "@mercurjs/client"
import { sdk } from "@lib/client"

import { ActionMenu } from "../../../../components/common/action-menu"
import { useUpdateSeller } from "@/hooks/api"
import { SellerStatus } from "@mercurjs/types"

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"]

type SellerGeneralSectionProps = {
  seller: Seller
}

const statusColorMap: Record<string, "orange" | "green" | "red"> = {
  [SellerStatus.PENDING]: "orange",
  [SellerStatus.ACTIVE]: "green",
  [SellerStatus.SUSPENDED]: "red",
}

export const SellerGeneralSection = ({
  seller,
}: SellerGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const { mutateAsync: updateSeller } = useUpdateSeller(seller.id)

  const statusColor = statusColorMap[seller.status] ?? "orange"

  const statusTextMap: Record<string, string> = {
    [SellerStatus.PENDING]: t("sellers.status.pending"),
    [SellerStatus.ACTIVE]: t("sellers.status.active"),
    [SellerStatus.SUSPENDED]: t("sellers.status.suspended"),
  }
  const statusText = statusTextMap[seller.status] ?? t("sellers.status.pending")

  const handleStatusChange = async (newStatus: SellerStatus) => {
    const labels: Record<SellerStatus, { title: string; description: string; success: string }> = {
      [SellerStatus.ACTIVE]: {
        title: "Activate account",
        description: "Are you sure you want to activate this seller account?",
        success: "Seller account activated",
      },
      [SellerStatus.SUSPENDED]: {
        title: "Suspend account",
        description: "Are you sure you want to suspend this seller account?",
        success: "Seller account suspended",
      },
      [SellerStatus.PENDING]: {
        title: "Set as pending",
        description: "Are you sure you want to set this seller account as pending?",
        success: "Seller account set to pending",
      },
    }

    const label = labels[newStatus]

    const res = await prompt({
      title: label.title,
      description: label.description,
      verificationText: seller.email || seller.name || "",
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await updateSeller(
      { status: newStatus },
      {
        onSuccess: () => {
          toast.success(label.success)
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  const statusActions = (() => {
    const actions = []

    if (seller.status !== SellerStatus.ACTIVE) {
      actions.push({
        label: "Activate account",
        onClick: () => handleStatusChange(SellerStatus.ACTIVE),
        icon: <CheckCircleSolid />,
      })
    }

    if (seller.status !== SellerStatus.SUSPENDED) {
      actions.push({
        label: "Suspend account",
        onClick: () => handleStatusChange(SellerStatus.SUSPENDED),
        icon: <XCircleSolid />,
      })
    }

    return actions
  })()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-3">
          {seller.logo ? (
            <img
              src={seller.logo}
              alt={seller.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="bg-ui-bg-component flex h-10 w-10 items-center justify-center rounded-lg border">
              <User className="text-ui-fg-subtle" />
            </div>
          )}
          <Heading>{seller.name || seller.email}</Heading>
        </div>
        <div className="flex items-center gap-x-2">
          <StatusBadge color={statusColor}>{statusText}</StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    to: `/sellers/${seller.id}/edit`,
                    icon: <PencilSquare />,
                  },
                ],
              },
              {
                actions: statusActions,
              },
            ]}
          />
        </div>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.name")}
        </Text>
        <Text size="small" leading="compact">
          {seller.name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.handle")}
        </Text>
        <Text size="small" leading="compact">
          {seller.handle || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.email")}
        </Text>
        <Text size="small" leading="compact">
          {seller.email || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.phone")}
        </Text>
        <Text size="small" leading="compact">
          {seller.phone || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.address_1")}
        </Text>
        <Text size="small" leading="compact">
          {seller.address_1 || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.address_2")}
        </Text>
        <Text size="small" leading="compact">
          {seller.address_2 || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.city")}
        </Text>
        <Text size="small" leading="compact">
          {seller.city || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.province")}
        </Text>
        <Text size="small" leading="compact">
          {seller.province || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.postal_code")}
        </Text>
        <Text size="small" leading="compact">
          {seller.postal_code || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("sellers.fields.country_code")}
        </Text>
        <Text size="small" leading="compact">
          {seller.country_code || "-"}
        </Text>
      </div>
    </Container>
  )
}
