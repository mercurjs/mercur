import { Divider, Heading } from "@medusajs/ui";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { ProductCreateSchemaType } from "../../types";
import { ProductCreateGeneralSection } from "./components/product-create-details-general-section";
import { ProductCreateMediaSection } from "./components/product-create-details-media-section";
import { ProductCreateVariantsSection } from "./components/product-create-details-variant-section";

type ProductAttributesProps = {
  form: UseFormReturn<ProductCreateSchemaType>;
};

export const ProductCreateDetailsForm = ({ form }: ProductAttributesProps) => {
  return (
    <div
      className="flex flex-col items-center p-16"
      data-testid="product-create-details-form"
    >
      <div
        className="flex w-full max-w-[720px] flex-col gap-y-8"
        data-testid="product-create-details-form-content"
      >
        <Header />
        <div
          className="flex flex-col gap-y-6"
          data-testid="product-create-details-form-sections"
        >
          <ProductCreateGeneralSection form={form} />
          <ProductCreateMediaSection form={form} />
        </div>
        <Divider data-testid="product-create-details-form-divider" />
        <ProductCreateVariantsSection form={form} />
      </div>
    </div>
  );
};

const Header = () => {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-col"
      data-testid="product-create-details-form-header"
    >
      <Heading data-testid="product-create-details-form-heading">
        {t("products.create.header")}
      </Heading>
    </div>
  );
};
