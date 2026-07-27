import { PencilSquare } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import {
  DisplayExtensionZone,
  DisplayField,
  useExtension,
} from "@mercurjs/dashboard-shared"
import { ActionMenu } from "../../../../../../components/common/action-menu"
import { useMe } from "../../../../../../hooks/api"
import { languages } from "../../../../../../i18n/languages"

export const ProfileGeneralSection = () => {
  const { i18n, t } = useTranslation()

  const memberLinks = useExtension().getLinks("member")
  const meQuery = memberLinks.length
    ? { fields: memberLinks.map((link) => `+member.${link}.*`).join(",") }
    : undefined

  const { seller_member } = useMe(meQuery)
  const member = seller_member?.member

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
      <DisplayField model="member" zone="general" id="first_name" data={member}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("profile.fields.firstName", "First name")}
          </Text>
          <Text size="small" leading="compact">
            {member?.first_name || "-"}
          </Text>
        </div>
      </DisplayField>
      <DisplayField model="member" zone="general" id="last_name" data={member}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("profile.fields.lastName", "Last name")}
          </Text>
          <Text size="small" leading="compact">
            {member?.last_name || "-"}
          </Text>
        </div>
      </DisplayField>
      <DisplayField model="member" zone="general" id="language" data={member}>
        <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
          <Text size="small" leading="compact" weight="plus">
            {t("profile.fields.languageLabel")}
          </Text>
          <Text size="small" leading="compact">
            {languages.find((lang) => lang.code === i18n.language)
              ?.display_name || "-"}
          </Text>
        </div>
      </DisplayField>
      <DisplayExtensionZone
        model="member"
        zone="general"
        data={member}
        builtInFieldIds={["first_name", "last_name", "language"]}
      />
    </Container>
  )
}
