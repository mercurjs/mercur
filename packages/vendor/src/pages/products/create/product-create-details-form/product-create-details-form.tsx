import { Heading } from "@medusajs/ui";
import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { TabDefinition } from "../types";
import { ProductCreateGeneralSection } from "./components/product-create-details-general-section";
import { ProductCreateMediaSection } from "./components/product-create-details-media-section";

const Root = ({ children }: { children?: ReactNode }) => {
  if (Children.count(children) > 0) {
    return (
      <div className="flex flex-col items-center p-16">
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <Header />
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <Header />
        <div className="flex flex-col gap-y-6">
          <ProductCreateGeneralSection />
          <ProductCreateMediaSection />
        </div>
      </div>
    </div>
  );
};

Root._tabMeta = {
  id: "details",
  labelKey: "products.create.tabs.details",
  validationFields: ["title", "media"],
} satisfies TabDefinition;

const Header = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <Heading>{t("products.create.tabs.details")}</Heading>
    </div>
  );
};

export const ProductCreateDetailsForm = Object.assign(Root, {
  _tabMeta: Root._tabMeta,
  GeneralSection: ProductCreateGeneralSection,
  MediaSection: ProductCreateMediaSection,
});
