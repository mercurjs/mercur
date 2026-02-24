import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { languages } from "../../../../../i18n/languages"

type ProfileGeneralSectionProps = {
  user: HttpTypes.AdminUser
}

export const ProfileGeneralSection = ({ user }: ProfileGeneralSectionProps) => {
  const { i18n, t } = useTranslation()

  const name = [user.first_name, user.last_name].filter(Boolean).join(" ")

  return (
    <Container className="divide-y p-0" data-testid="profile-general-section">
      <div className="flex items-center justify-between px-6 py-4" data-testid="profile-general-section-header">
        <div>
          <Heading data-testid="profile-general-section-heading">{t("profile.domain")}</Heading>
          <Text className="text-ui-fg-subtle" size="small" data-testid="profile-general-section-description">
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
          data-testid="profile-general-section-action-menu"
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4" data-testid="profile-general-section-name-row">
        <Text size="small" leading="compact" weight="plus" data-testid="profile-general-section-name-label">
          {t("fields.name")}
        </Text>
        <Text size="small" leading="compact" data-testid="profile-general-section-name-value">
          {name || "-"}
        </Text>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4" data-testid="profile-general-section-email-row">
        <Text size="small" leading="compact" weight="plus" data-testid="profile-general-section-email-label">
          {t("fields.email")}
        </Text>
        <Text size="small" leading="compact" data-testid="profile-general-section-email-value">
          {user.email}
        </Text>
      </div>
      <div className="grid grid-cols-2 items-center px-6 py-4" data-testid="profile-general-section-language-row">
        <Text size="small" leading="compact" weight="plus" data-testid="profile-general-section-language-label">
          {t("profile.fields.languageLabel")}
        </Text>
        <Text size="small" leading="compact" data-testid="profile-general-section-language-value">
          {languages.find((lang) => lang.code === i18n.language)
            ?.display_name || "-"}
        </Text>
      </div>
      {/* TODO: Do we want to implement usage insights in V2? */}
      {/* <div className="grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("profile.fields.usageInsightsLabel")}
        </Text>
        <StatusBadge color="red" className="w-fit">
          {t("general.disabled")}
        </StatusBadge>
      </div> */}
    </Container>
  )
}
