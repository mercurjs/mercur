import { UseFormReturn } from "react-hook-form"

import { StackedFocusModal } from "../../../../../components/modals"
import { FormExtensionZone } from "../../../../../dashboard-app"
import { useExtension } from "../../../../../providers/extension-provider"
import { ProductCreateSchemaType } from "../../types"
import { ProductCreateOrganizationSection } from "./components/product-create-organize-section"
import { ProductCreateSalesChannelStackedModal } from "./components/product-create-sales-channel-stacked-modal"
import { SC_STACKED_MODAL_ID } from "./constants"

type ProductAttributesProps = {
  form: UseFormReturn<ProductCreateSchemaType>
}

export const ProductCreateOrganizeForm = ({ form }: ProductAttributesProps) => {
  const { getFormFields } = useExtension()
  const fields = getFormFields("product", "create", "organize")

  return (
    <StackedFocusModal id={SC_STACKED_MODAL_ID}>
      <div className="flex flex-col items-center p-16" data-testid="product-create-organize-form">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8" data-testid="product-create-organize-form-content">
          <ProductCreateOrganizationSection form={form} />
          <FormExtensionZone fields={fields} form={form} />
          {/* TODO: WHERE DO WE SET PRODUCT ATTRIBUTES? -> the plan is to moved that to Inventory UI */}
          {/* <Divider />*/}
          {/* <ProductCreateAttributeSection form={form} />*/}
        </div>
      </div>
      <ProductCreateSalesChannelStackedModal form={form} />
    </StackedFocusModal>
  )
}
