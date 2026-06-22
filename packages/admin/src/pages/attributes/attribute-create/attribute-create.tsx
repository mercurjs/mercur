import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { RouteFocusModal } from "../../../components/modals";
import { TabbedForm } from "../../../components/tabbed-form/tabbed-form";
import { AttributeCreateForm } from "./components/attribute-create-form";
import { AttributeCreateDetailsTab } from "./components/attribute-create-details-tab";
import { AttributeCreateTypeTab } from "./components/attribute-create-type-tab";

const Root = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <RouteFocusModal data-testid="attribute-create-modal">
      <RouteFocusModal.Title asChild>
        <span className="sr-only">{t("attributes.create.header")}</span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">{t("attributes.create.subtitle")}</span>
      </RouteFocusModal.Description>
      {Children.count(children) > 0 ? children : <AttributeCreateForm />}
    </RouteFocusModal>
  );
};

export const AttributeCreate = Root;

export const AttributeCreatePage = Object.assign(Root, {
  Form: AttributeCreateForm,
  DetailsTab: AttributeCreateDetailsTab,
  TypeTab: AttributeCreateTypeTab,
  Tab: TabbedForm.Tab,
});
