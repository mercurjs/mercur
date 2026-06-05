import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { RouteDrawer } from "../../../../components/modals"
import { EditProfileForm } from "./components/edit-profile-form/edit-profile-form"

export const ProfileEdit = () => {
  const { t } = useTranslation()

  return (
    <RouteDrawer>
      <RouteDrawer.Header className="capitalize">
        <RouteDrawer.Title asChild>
          <Heading>{t("profile.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      <EditProfileForm />
    </RouteDrawer>
  )
}
