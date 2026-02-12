import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import ImageAvatar from "@components/common/image-avatar/image-avatar"

type StoreGeneralSectionProps = {
  store: HttpTypes.AdminStore
}

export const StoreGeneralSection = ({ store }: StoreGeneralSectionProps) => {
  const { t } = useTranslation()
  const storeAny = store as any

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-4">
          {storeAny.photo && <ImageAvatar src={storeAny.photo} size={12} />}
          <div>
            <Heading>{t("store.domain", "Store")}</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              {t("store.manageYourStoresDetails", "Manage your store's details")}
            </Text>
          </div>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: "edit",
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.name")}
        </Text>
        <Text size="small" leading="compact">
          {store.name || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.email")}
        </Text>
        <Text size="small" leading="compact">
          {storeAny.email || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.phone")}
        </Text>
        <Text size="small" leading="compact">
          {storeAny.phone || "-"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.description")}
        </Text>
        <Text size="small" leading="compact">
          {storeAny.description || "-"}
        </Text>
      </div>
    </Container>
  )
}
