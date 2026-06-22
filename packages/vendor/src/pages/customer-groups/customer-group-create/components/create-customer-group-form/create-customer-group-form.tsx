import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, Text, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Form } from "@components/common/form";
import { RouteFocusModal, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { useCreateCustomerGroup } from "@hooks/api/customer-groups";

import {
  CreateCustomerGroupSchema,
  CreateCustomerGroupSchemaType,
} from "./schema";

export const CreateCustomerGroupForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<CreateCustomerGroupSchemaType>({
    defaultValues: {
      name: "",
    },
    resolver: zodResolver(CreateCustomerGroupSchema),
  });

  const { mutateAsync, isPending } = useCreateCustomerGroup();

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        name: data.name,
      },
      {
        onSuccess: ({ customer_group }) => {
          toast.success(
            t("customerGroups.create.successToast", {
              name: customer_group.name,
            }),
          );

          handleSuccess(`/customer-groups/${customer_group.id}`);
        },
        onError: (error) => {
          const message = error.message?.toLowerCase() ?? "";
          const isDuplicate =
            error.status === 409 ||
            message.includes("already exist") ||
            message.includes("duplicate") ||
            message.includes("unique");

          toast.error(
            isDuplicate
              ? t("customerGroups.create.alreadyExistsToast", {
                  name: data.name,
                })
              : error.message,
          );
        },
      },
    );
  });

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
        data-testid="create-customer-group-form"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col items-center pt-[72px]">
          <div className="flex size-full max-w-[720px] flex-col gap-y-8">
            <div>
              <RouteFocusModal.Title asChild>
                <Heading data-testid="create-customer-group-form-title">
                  {t("customerGroups.create.header")}
                </Heading>
              </RouteFocusModal.Title>
              <RouteFocusModal.Description asChild>
                <Text
                  size="small"
                  className="text-ui-fg-subtle"
                  data-testid="create-customer-group-form-hint"
                >
                  {t("customerGroups.create.hint")}
                </Text>
              </RouteFocusModal.Description>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.name")}</Form.Label>
                      <Form.Control>
                        <Input
                          {...field}
                          data-testid="create-customer-group-form-name-input"
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                variant="secondary"
                size="small"
                data-testid="create-customer-group-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
              data-testid="create-customer-group-form-submit-button"
            >
              {t("actions.create")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
