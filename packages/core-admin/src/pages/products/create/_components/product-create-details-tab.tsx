import { Divider, Heading } from "@medusajs/ui"
import { ReactNode, Children } from "react"
import { useTranslation } from "react-i18next"

import { FormExtensionZone } from "@/dashboard-app"
import { useExtension } from "@providers/extension-provider"

import { ProductCreateGeneralSection } from "./product-create-details-form/components/product-create-details-general-section"
import { ProductCreateMediaSection } from "./product-create-details-form/components/product-create-details-media-section"
import { ProductCreateVariantsSection } from "./product-create-details-form/components/product-create-details-variant-section"
import { useProductCreateContext } from "./product-create-context"

function DetailsTabHeader() {
  const { t } = useTranslation()
  return (
    <div
      className="flex flex-col"
      data-testid="product-create-details-form-header"
    >
      <Heading data-testid="product-create-details-form-heading">
        {t("products.create.header")}
      </Heading>
    </div>
  )
}

function DetailsTabGeneralSection() {
  const { form } = useProductCreateContext()
  const { getFormFields } = useExtension()
  const fields = getFormFields("product", "create", "general")

  return (
    <div
      className="flex flex-col gap-y-6"
      data-testid="product-create-details-form-sections"
    >
      <ProductCreateGeneralSection form={form} />
      <FormExtensionZone fields={fields} form={form} />
    </div>
  )
}

function DetailsTabMediaSection() {
  const { form } = useProductCreateContext()
  return <ProductCreateMediaSection form={form} />
}

function DetailsTabVariantSection() {
  const { form } = useProductCreateContext()
  return <ProductCreateVariantsSection form={form} />
}

interface DetailsTabProps {
  children?: ReactNode
}

function DetailsTabRoot({ children }: DetailsTabProps) {
  const hasCustom = Children.count(children) > 0

  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="product-create-details-form"
    >
      <div
        className="flex w-full max-w-[720px] flex-col gap-y-8"
        data-testid="product-create-details-form-content"
      >
        {hasCustom ? (
          children
        ) : (
          <>
            <DetailsTab.Header />
            <DetailsTab.GeneralSection />
            <DetailsTab.MediaSection />
            <Divider data-testid="product-create-details-form-divider" />
            <DetailsTab.VariantSection />
          </>
        )}
      </div>
    </div>
  )
}

export const DetailsTab = Object.assign(DetailsTabRoot, {
  Header: DetailsTabHeader,
  GeneralSection: DetailsTabGeneralSection,
  MediaSection: DetailsTabMediaSection,
  VariantSection: DetailsTabVariantSection,
})
