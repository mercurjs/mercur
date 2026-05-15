import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RouteFocusModal } from "../../../components/modals";
import { useSalesChannel } from "../../../hooks/api/sales-channels";
import { useStore } from "../../../hooks/api/store";
import { TabbedForm } from "../../../components/tabbed-form/tabbed-form";
import { ProductCreateForm } from "./components/product-create-form/product-create-form";
import { ProductCreateDetailsForm } from "./components/product-create-details-form";
import { ProductCreateOrganizeForm } from "./components/product-create-organize-form";
import { ProductCreateVariantsForm } from "./components/product-create-variants-form";
import { ProductCreateInventoryKitForm } from "./components/product-create-inventory-kit-form";

const Root = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();

  const {
    store,
    isPending: isStorePending,
    isError: isStoreError,
    error: storeError,
  } = useStore({
    fields: "+default_sales_channel",
  });

  const {
    sales_channel,
    isPending: isSalesChannelPending,
    isError: isSalesChannelError,
    error: salesChannelError,
  } = useSalesChannel(store?.default_sales_channel_id!, {
    enabled: !!store?.default_sales_channel_id,
  });

  const ready =
    !!store && !isStorePending && !!sales_channel && !isSalesChannelPending;

  if (isStoreError) {
    throw storeError;
  }

  if (isSalesChannelError) {
    throw salesChannelError;
  }

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("products.create.title")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("products.create.description")}</span>
      </RouteFocusModal.Description>
      {ready &&
        (Children.count(children) > 0 ? (
          children
        ) : (
          <ProductCreateForm defaultChannel={sales_channel} />
        ))}
    </RouteFocusModal>
  );
};

export const ProductCreate = Root;

export const ProductCreatePage = Object.assign(Root, {
  Form: ProductCreateForm,
  DetailsTab: ProductCreateDetailsForm,
  OrganizeTab: ProductCreateOrganizeForm,
  VariantsTab: ProductCreateVariantsForm,
  InventoryTab: ProductCreateInventoryKitForm,
  Tab: TabbedForm.Tab,
});
