import { Children, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { RouteFocusModal } from "../../../components/modals";
import { CreateCommissionRuleForm } from "./components/create-commission-rule-form/create-commission-rule-form";

const Root = ({ children }: { children?: ReactNode }) => {
  const { t } = useTranslation();

  return (
    <RouteFocusModal>
      <RouteFocusModal.Title asChild>
        <span className="sr-only">
          {t("commissions.create.header")}
        </span>
      </RouteFocusModal.Title>
      <RouteFocusModal.Description asChild>
        <span className="sr-only">
          {t("commissions.create.header")}
        </span>
      </RouteFocusModal.Description>
      {Children.count(children) > 0 ? children : <CreateCommissionRuleForm />}
    </RouteFocusModal>
  );
};

export const CommissionRuleCreate = Object.assign(Root, {
  Form: CreateCommissionRuleForm,
});
