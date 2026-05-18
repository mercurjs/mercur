import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Textarea, toast } from "@medusajs/ui";
import { Heading } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { ProductAttributeDTO } from "@mercurjs/types";
import { Form } from "../../../components/common/form";
import { SwitchBox } from "../../../components/common/switch-box";
import { HandleInput } from "../../../components/inputs/handle-input";
import { RouteDrawer, useRouteModal } from "../../../components/modals";
import { KeyboundForm } from "../../../components/utilities/keybound-form";
import {
  useProductAttribute,
  useUpdateProductAttribute,
} from "../../../hooks/api/product-attributes";
import { UpdateAttributeSchema } from "./schema";
import type { UpdateAttributeFormValues } from "./types";

type AttributeEditFormProps = {
  attribute: ProductAttributeDTO;
};

const AttributeEditForm = ({ attribute }: AttributeEditFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<UpdateAttributeFormValues>({
    resolver: zodResolver(UpdateAttributeSchema),
    defaultValues: {
      name: attribute.name ?? "",
      handle: attribute.handle ?? "",
      description: attribute.description ?? "",
      is_filterable: attribute.is_filterable ?? false,
      is_required: attribute.is_required ?? false,
    },
  });

  const { mutateAsync, isPending: isMutating } = useUpdateProductAttribute(
    attribute.id,
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: () => {
        toast.success(
          t("attributes.edit.successToast", {
            name: data.name,
          }),
        );
        handleSuccess();
      },
      onError: (err) => {
        toast.error(err.message);
      },
    });
  });

  return (
    <RouteDrawer.Form form={form} data-testid="attribute-edit-form">
      <KeyboundForm
        className="flex size-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteDrawer.Body
          className="flex flex-1 flex-col gap-y-8 overflow-y-auto"
          data-testid="attribute-edit-form-body"
        >
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item data-testid="attribute-edit-name-field">
                  <Form.Label>{t("attributes.fields.name")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="handle"
              render={({ field }) => (
                <Form.Item data-testid="attribute-edit-handle-field">
                  <Form.Label optional>
                    {t("attributes.fields.handle")}
                  </Form.Label>
                  <Form.Control>
                    <HandleInput {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item data-testid="attribute-edit-description-field">
                  <Form.Label optional>
                    {t("attributes.fields.description")}
                  </Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

          </div>

          <div className="flex flex-col gap-y-4">
            <SwitchBox
              control={form.control}
              name="is_required"
              label={t("attributes.fields.isRequired", "Required attribute")}
              description={t(
                "attributes.fields.isRequiredHint",
                "If checked, vendors must set a value for this attribute.",
              )}
              data-testid="attribute-edit-required-switch"
            />

            <SwitchBox
              control={form.control}
              name="is_filterable"
              label={t("attributes.fields.isFilterable", "Filterable attribute")}
              description={t(
                "attributes.fields.isFilterableHint",
                "If checked, buyers will be able to filter products using this attribute.",
              )}
              data-testid="attribute-edit-filterable-switch"
            />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="attribute-edit-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small" type="button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isMutating}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};

export const AttributeEdit = () => {
  const { id } = useParams();

  const {
    product_attribute: attribute,
    isPending,
    isError,
    error,
  } = useProductAttribute(id!);

  if (isError) {
    throw error;
  }

  if (isPending || !attribute) {
    return null;
  }

  return (
    <RouteDrawer data-testid="attribute-edit-drawer">
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{attribute.name}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          Edit attribute
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <AttributeEditForm attribute={attribute} />
    </RouteDrawer>
  );
};
