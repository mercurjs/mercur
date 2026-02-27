import { PencilSquare, User } from "@medusajs/icons"
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

  const handleSuspend = async () => {
    const isSuspended = seller.status === SellerStatus.SUSPENDED

    const res = await prompt({
      title: isSuspended
        ? t("sellers.status.active")
        : t("sellers.status.suspended"),
      description: isSuspended
        ? "Are you sure you want to activate this account?"
        : "Are you sure you want to suspend this account?",
      verificationText: seller.email || seller.name || "",
      confirmText: t("actions.confirm"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await updateSeller(
      {
        status: isSuspended ? SellerStatus.ACTIVE : SellerStatus.SUSPENDED,
      },
      {
        onSuccess: () => {
          toast.success(
            isSuspended
              ? "Seller account activated"
              : "Seller account suspended"
          )
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

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
                actions: [
                  {
                    label:
                      seller.status === SellerStatus.SUSPENDED
                        ? "Activate account"
                        : "Suspend account",
                    onClick: handleSuspend,
                    icon: <User />,
                  },
                ],
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
