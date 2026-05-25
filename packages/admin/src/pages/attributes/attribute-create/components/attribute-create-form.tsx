import { Button, toast } from "@medusajs/ui";
import { Children, ReactNode, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AttributeType } from "@mercurjs/types";

import { RouteFocusModal, useRouteModal } from "../../../../components/modals";
import { TabbedForm } from "../../../../components/tabbed-form/tabbed-form";
import { useCreateProductAttribute } from "../../../../hooks/api";
import { CreateAttributeSchema } from "../../attribute-edit/schema";
import { AttributeCreateDetailsTab } from "./attribute-create-details-tab";
import { AttributeCreateTypeTab } from "./attribute-create-type-tab";

type CreateAttributeFormValues = z.infer<typeof CreateAttributeSchema>;

type AttributeCreateFormProps = {
  children?: ReactNode;
};

export const AttributeCreateForm = ({ children }: AttributeCreateFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<CreateAttributeFormValues>({
    defaultValues: {
      name: "",
      description: "",
      handle: "",
      type: AttributeType.SINGLE_SELECT,
      is_filterable: false,
      is_required: false,
      is_variant_axis: false,
      values: [],
      category_ids: [],
      metadata: {},
    },
    resolver: zodResolver(CreateAttributeSchema),
  });

  const { mutateAsync, isPending } = useCreateProductAttribute();

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        ...values,
        handle: values.handle ? values.handle : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            t("attributes.create.successToast", { name: values.name }),
          );
          handleSuccess("/settings/attributes");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  const defaultTabs = useMemo(
    () => [
      <AttributeCreateDetailsTab key="details" />,
      <AttributeCreateTypeTab key="type" />,
    ],
    [],
  );

  const hasCustomChildren = Children.count(children) > 0;

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending}
      footer={({ isLastTab, onNext, isLoading }) => (
        <div className="flex items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button
              variant="secondary"
              size="small"
              data-testid="attribute-create-cancel-button"
            >
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          {isLastTab ? (
            <Button
              key="submit-button"
              type="submit"
              variant="primary"
              size="small"
              isLoading={isLoading}
              data-testid="attribute-create-save-button"
            >
              {t("actions.save")}
            </Button>
          ) : (
            <Button
              key="next-button"
              type="button"
              variant="primary"
              size="small"
              onClick={() => onNext()}
              data-testid="attribute-create-continue-button"
            >
              {t("actions.continue")}
            </Button>
          )}
        </div>
      )}
    >
      {hasCustomChildren ? children : defaultTabs}
    </TabbedForm>
  );
};
