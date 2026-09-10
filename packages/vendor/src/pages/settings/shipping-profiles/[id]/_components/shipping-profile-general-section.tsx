import { AdminShippingProfileResponse } from "@medusajs/types"
import { Container, Heading } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { SectionRow } from "@components/common/section"

type ShippingProfileGeneralSectionProps = {
  profile: AdminShippingProfileResponse["shipping_profile"]
}

export const ShippingProfileGeneralSection = ({
  profile,
}: ShippingProfileGeneralSectionProps) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{profile.name}</Heading>
      </div>
      <SectionRow title={t("fields.type")} value={profile.type} />
    </Container>
  )
}
