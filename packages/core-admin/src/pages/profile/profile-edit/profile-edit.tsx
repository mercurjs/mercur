import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { RouteDrawer } from "../../../components/modals"
import { useMe } from "../../../hooks/api/users"
import { EditProfileForm } from "./components/edit-profile-form/edit-profile-form"

export const ProfileEdit = () => {
  const { user, isPending: isLoading, isError, error } = useMe()

  const { t } = useTranslation()

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer data-testid="profile-edit-drawer">
      <RouteDrawer.Header className="capitalize" data-testid="profile-edit-drawer-header">
        <RouteDrawer.Title asChild>
          <Heading data-testid="profile-edit-drawer-title">{t("profile.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && user && <EditProfileForm user={user} />}
    </RouteDrawer>
  )
}
