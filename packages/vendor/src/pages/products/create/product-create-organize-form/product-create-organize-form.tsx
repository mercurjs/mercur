import { UseFormReturn } from "react-hook-form";

import { StackedFocusModal } from "@components/modals";
import { ProductCreateSchemaType } from "../../types";
import { ProductCreateOrganizationSection } from "./components/product-create-organize-section";
import { ProductCreateSalesChannelStackedModal } from "./components/product-create-sales-channel-stacked-modal";
import { SC_STACKED_MODAL_ID } from "./constants";

type ProductAttributesProps = {
  form: UseFormReturn<ProductCreateSchemaType>;
};

export const ProductCreateOrganizeForm = ({ form }: ProductAttributesProps) => {
  return (
    <StackedFocusModal id={SC_STACKED_MODAL_ID}>
      <div className="flex flex-col items-center p-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <ProductCreateOrganizationSection form={form} />
        </div>
      </div>
      <ProductCreateSalesChannelStackedModal form={form} />
    </StackedFocusModal>
  );
};
