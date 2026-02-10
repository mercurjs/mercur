import { Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { RouteDrawer } from "@components/modals"
import { useUserMe } from "@hooks/api/users"
import { EditProfileForm } from "./_components/edit-profile-form"

const ProfileEdit = () => {
  const { member, isPending: isLoading, isError, error } = useUserMe()
  const { t } = useTranslation()

  if (isError) {
    throw error
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header className="capitalize">
        <RouteDrawer.Title asChild>
          <Heading>{t("profile.edit.header")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {!isLoading && member && <EditProfileForm user={member} />}
    </RouteDrawer>
  )
}

export const Component = ProfileEdit
