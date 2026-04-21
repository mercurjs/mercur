import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@medusajs/ui";
import { Children, ReactNode, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useRouteModal } from "../../../../components/modals";
import { TabbedForm } from "../../../../components/tabbed-form/tabbed-form";
import { useCreateSeller } from "../../../../hooks/api/sellers";

import { CreateStoreSchema, CreateStoreSchemaType } from "./schema";
import { StoreCreateDetailsTab } from "./store-create-details-tab";
import { StoreCreateUsersTab } from "./store-create-users-tab";

type StoreCreateFormProps = {
  children?: ReactNode;
};

export const StoreCreateForm = ({ children }: StoreCreateFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<CreateStoreSchemaType>({
    defaultValues: {
      name: "",
      email: "",
      currency_code: "",
      handle: "",
      member_email: "",
    },
    resolver: zodResolver(CreateStoreSchema),
  });

  const { mutateAsync: createSeller, isPending } = useCreateSeller();

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createSeller({
        name: values.name,
        email: values.email,
        currency_code: values.currency_code,
        handle: values.handle || undefined,
        member: {
          email: values.member_email,
        },
      });

      toast.success(
        t("stores.create.successToast", "Store created successfully"),
      );
      handleSuccess();
    } catch (error) {
      toast.error((error as Error).message);
    }
  });

  const defaultTabs = useMemo(
    () => [
      <StoreCreateDetailsTab key="details" />,
      <StoreCreateUsersTab key="users" />,
    ],
    [],
  );

  return (
    <TabbedForm form={form} onSubmit={handleSubmit} isLoading={isPending}>
      {Children.count(children) > 0 ? children : defaultTabs}
    </TabbedForm>
  );
};
