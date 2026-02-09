import { ReactNode, Children } from "react"

import { StackedFocusModal } from "@components/modals"
import { FormExtensionZone } from "@/dashboard-app"
import { useExtension } from "@providers/extension-provider"

import { ProductCreateOrganizationSection } from "./product-create-organize-form/components/product-create-organize-section"
import { ProductCreateSalesChannelStackedModal } from "./product-create-organize-form/components/product-create-sales-channel-stacked-modal"
import { SC_STACKED_MODAL_ID } from "./product-create-organize-form/constants"
import { useProductCreateContext } from "./product-create-context"

function OrganizeTabOrganizationSection() {
  const { form } = useProductCreateContext()
  const { getFormFields } = useExtension()
  const fields = getFormFields("product", "create", "organize")

  return (
    <>
      <ProductCreateOrganizationSection form={form} />
      <FormExtensionZone fields={fields} form={form} />
    </>
  )
}

function OrganizeTabSalesChannelModal() {
  const { form } = useProductCreateContext()
  return <ProductCreateSalesChannelStackedModal form={form} />
}

interface OrganizeTabProps {
  children?: ReactNode
}

function OrganizeTabRoot({ children }: OrganizeTabProps) {
  const hasCustom = Children.count(children) > 0

  return (
    <StackedFocusModal id={SC_STACKED_MODAL_ID}>
      <div
        className="flex flex-col items-center p-16"
        data-testid="product-create-organize-form"
      >
        <div
          className="flex w-full max-w-[720px] flex-col gap-y-8"
          data-testid="product-create-organize-form-content"
        >
          {hasCustom ? children : <OrganizeTab.OrganizationSection />}
        </div>
      </div>
      <OrganizeTab.SalesChannelModal />
    </StackedFocusModal>
  )
}

export const OrganizeTab = Object.assign(OrganizeTabRoot, {
  OrganizationSection: OrganizeTabOrganizationSection,
  SalesChannelModal: OrganizeTabSalesChannelModal,
})
