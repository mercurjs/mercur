import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RouteFocusModal } from "../../../components/modals";
import { TabbedForm } from "../../../components/tabbed-form/tabbed-form";
import { ProductCreateForm } from "./components/product-create-form/product-create-form";
import { ProductCreateDetailsForm } from "./components/product-create-details-form";
import { ProductCreateOrganizeForm } from "./components/product-create-organize-form";
import { ProductCreateAttributesForm } from "./components/product-create-attributes-form";
import { ProductCreateVariantsForm } from "./components/product-create-variants-form";
import { ProductCreateInventoryKitForm } from "./components/product-create-inventory-kit-form";

const Root = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.create.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.create.description")}</span>
      </RouteFocusModal.Description>
      {Children.count(children) > 0 ? children : <ProductCreateForm />}
    </RouteFocusModal>
  );
};

export const ProductCreate = Root;

export const ProductCreatePage = Object.assign(Root, {
  Form: ProductCreateForm,
  DetailsTab: ProductCreateDetailsForm,
  OrganizeTab: ProductCreateOrganizeForm,
  AttributesTab: ProductCreateAttributesForm,
  VariantsTab: ProductCreateVariantsForm,
  InventoryTab: ProductCreateInventoryKitForm,
  Tab: TabbedForm.Tab,
});
