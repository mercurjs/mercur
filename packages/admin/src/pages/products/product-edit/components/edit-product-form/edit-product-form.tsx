import { HttpTypes } from "@medusajs/types";
import { Button, Input, Select, Text, Textarea, toast } from "@medusajs/ui";

import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "../../../../../components/common/form";
import { SwitchBox } from "../../../../../components/common/switch-box";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { FormExtensionZone } from "../../../../../dashboard-app";
import { useExtendableForm } from "../../../../../dashboard-app/forms/hooks";
import { useUpdateProduct } from "../../../../../hooks/api/products";
import { useDocumentDirection } from "../../../../../hooks/use-document-direction";
import { transformNullableFormData } from "../../../../../lib/form-helpers";
import { useExtension } from "../../../../../providers/extension-provider";

type EditProductFormProps = {
  product: HttpTypes.AdminProduct;
};

const EditProductSchema = zod.object({
  status: zod.enum(["draft", "published", "proposed", "rejected"]),
  title: zod.string().min(1),
  subtitle: zod.string().optional(),
  handle: zod.string().min(1),
  material: zod.string().optional(),
  description: zod.string().optional(),
  discountable: zod.boolean(),
});

export const EditProductForm = ({ product }: EditProductFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();
  const { getFormFields, getFormConfigs } = useExtension();
  const fields = getFormFields("product", "edit");
  const configs = getFormConfigs("product", "edit");

  const form = useExtendableForm({
    defaultValues: {
      status: product.status,
      title: product.title,
      material: product.material || "",
      subtitle: product.subtitle || "",
      handle: product.handle || "",
      description: product.description || "",
      discountable: product.discountable,
    },
    schema: EditProductSchema,
    configs: configs,
    data: product,
  });

  const { mutateAsync, isPending } = useUpdateProduct(product.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    const { title, discountable, handle, status, ...optional } = data;

    const nullableData = transformNullableFormData(optional);

    await mutateAsync(
      {
        title,
        discountable,
        handle,
        status: status as HttpTypes.AdminProductStatus,
        ...nullableData,
      },
      {
        onSuccess: ({ product }) => {
          toast.success(
            t("products.edit.successToast", { title: product.title }),
          );
          handleSuccess();
        },
        onError: (e) => {
          toast.error(e.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form} data-testid="product-edit-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="product-edit-keybound-form"
      >
        <RouteDrawer.Body
          className="flex flex-1 flex-col gap-y-8 overflow-y-auto"
          data-testid="product-edit-form-body"
        >
          <div
            className="flex flex-col gap-y-8"
            data-testid="product-edit-form-fields"
          >
            <div
              className="flex flex-col gap-y-4"
              data-testid="product-edit-form-main-fields"
            >
              <Form.Field
                control={form.control}
                name="status"
                render={({ field: { onChange, ref, ...field } }) => {
                  return (
                    <Form.Item data-testid="product-edit-form-status-item">
                      <Form.Label data-testid="product-edit-form-status-label">
                        {t("fields.status")}
                      </Form.Label>
                      <Form.Control data-testid="product-edit-form-status-control">
                        <div data-testid="product-edit-form-status-select-wrapper">
                          <Select
                            dir={direction}
                            {...field}
                            onValueChange={onChange}
                            data-testid="product-edit-form-status-select"
                          >
                            <Select.Trigger
                              ref={ref}
                              data-testid="product-edit-form-status-trigger"
                            >
                              <Select.Value data-testid="product-edit-form-status-value" />
                            </Select.Trigger>
                            <Select.Content data-testid="product-edit-form-status-content">
                              {(
                                [
                                  "draft",
                                  "published",
                                  "proposed",
                                  "rejected",
                                ] as const
                              ).map((status) => {
                                return (
                                  <Select.Item
                                    key={status}
                                    value={status}
                                    data-testid={`product-edit-form-status-option-${status}`}
                                  >
                                    {t(`products.productStatus.${status}`)}
                                  </Select.Item>
                                );
                              })}
                            </Select.Content>
                          </Select>
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-edit-form-status-error" />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-edit-form-title-item">
                      <Form.Label data-testid="product-edit-form-title-label">
                        {t("fields.title")}
                      </Form.Label>
                      <Form.Control data-testid="product-edit-form-title-control">
                        <div data-testid="product-edit-form-title-input-wrapper">
                          <Input
                            {...field}
                            data-testid="product-edit-form-title-input"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-edit-form-title-error" />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="subtitle"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-edit-form-subtitle-item">
                      <Form.Label
                        optional
                        data-testid="product-edit-form-subtitle-label"
                      >
                        {t("fields.subtitle")}
                      </Form.Label>
                      <Form.Control data-testid="product-edit-form-subtitle-control">
                        <div data-testid="product-edit-form-subtitle-input-wrapper">
                          <Input
                            {...field}
                            data-testid="product-edit-form-subtitle-input"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-edit-form-subtitle-error" />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="handle"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-edit-form-handle-item">
                      <Form.Label data-testid="product-edit-form-handle-label">
                        {t("fields.handle")}
                      </Form.Label>
                      <Form.Control data-testid="product-edit-form-handle-control">
                        <div
                          className="relative"
                          data-testid="product-edit-form-handle-wrapper"
                        >
                          <div
                            className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center border-r"
                            data-testid="product-edit-form-handle-prefix"
                          >
                            <Text
                              className="text-ui-fg-muted"
                              size="small"
                              leading="compact"
                              weight="plus"
                              data-testid="product-edit-form-handle-prefix-text"
                            >
                              /
                            </Text>
                          </div>
                          <div data-testid="product-edit-form-handle-input-wrapper">
                            <Input
                              {...field}
                              className="pl-10"
                              data-testid="product-edit-form-handle-input"
                            />
                          </div>
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-edit-form-handle-error" />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="material"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-edit-form-material-item">
                      <Form.Label
                        optional
                        data-testid="product-edit-form-material-label"
                      >
                        {t("fields.material")}
                      </Form.Label>
                      <Form.Control data-testid="product-edit-form-material-control">
                        <div data-testid="product-edit-form-material-input-wrapper">
                          <Input
                            {...field}
                            data-testid="product-edit-form-material-input"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-edit-form-material-error" />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-edit-form-description-item">
                      <Form.Label
                        optional
                        data-testid="product-edit-form-description-label"
                      >
                        {t("fields.description")}
                      </Form.Label>
                      <Form.Control data-testid="product-edit-form-description-control">
                        <div data-testid="product-edit-form-description-textarea-wrapper">
                          <Textarea
                            {...field}
                            data-testid="product-edit-form-description-textarea"
                          />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-edit-form-description-error" />
                    </Form.Item>
                  );
                }}
              />
            </div>
            <SwitchBox
              control={form.control}
              name="discountable"
              label={t("fields.discountable")}
              description={t("products.discountableHint")}
              data-testid="product-edit-form-discountable-switch"
            />
            <FormExtensionZone
              fields={fields}
              form={form}
              data-testid="product-edit-form-extension-zone"
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-edit-form-footer">
          <div
            className="flex items-center justify-end gap-x-2"
            data-testid="product-edit-form-footer-actions"
          >
            <RouteDrawer.Close
              asChild
              data-testid="product-edit-form-cancel-button-wrapper"
            >
              <Button
                size="small"
                variant="secondary"
                data-testid="product-edit-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="product-edit-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
