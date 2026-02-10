import { PencilSquare } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { ActionMenu } from "@components/common/action-menu"
import { ImageAvatar } from "@components/common/image-avatar"
import { TeamMemberProps } from "@custom-types/user"

type ProfileGeneralSectionProps = {
  user: TeamMemberProps
}

export const ProfileGeneralSection = ({ user }: ProfileGeneralSectionProps) => {
  const { t } = useTranslation()

  const { name, email, photo, phone, bio } = user

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("profile.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("profile.manageYourProfileDetails")}
          </Text>
        </div>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "edit",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Photo
        </Text>
        <ImageAvatar src={photo || "/logo.svg"} size={8} rounded />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.name")}
        </Text>
        <Text size="small" leading="compact">
          {name || "-"}
        </Text>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.email")}
        </Text>
        <Text size="small" leading="compact">
          {email}
        </Text>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Phone
        </Text>
        <Text size="small" leading="compact">
          {phone}
        </Text>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Bio
        </Text>
        <Text size="small" leading="compact">
          {bio}
        </Text>
      </div>
    </Container>
  )
}
