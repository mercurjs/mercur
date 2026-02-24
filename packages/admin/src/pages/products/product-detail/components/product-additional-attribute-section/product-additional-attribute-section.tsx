import { useEffect, useState } from "react";

import { InformationCircleSolid, PencilSquare } from "@medusajs/icons";
import {
  Button,
  Container,
  Heading,
  Label,
  Tooltip,
  toast,
} from "@medusajs/ui";
import { Drawer } from "@medusajs/ui";

import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { ActionMenu } from "../../../../../components/common/action-menu";
import { SectionRow } from "../../../../../components/common/section";
import {
  useProduct,
  useProductAttributes,
  useUpdateProduct,
} from "../../../../../hooks/api";
import { FormComponents } from "./components/form-components";

export const ProductAdditionalAttributeSection = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [open, setOpen] = useState(false);
  const { product, isLoading: isProductLoading } = useProduct(id!, {
    fields: "attribute_values.*,attribute_values.attribute.*",
  });

  const { data, isLoading } = useProductAttributes(id!);

  const attributes = data?.attributes || [];

  const { mutate: updateProduct } = useUpdateProduct(id!);

  const form = useForm<any>({
    defaultValues: {},
  });

  // Reset form when product data is loaded
  useEffect(() => {
    if (product?.attribute_values) {
      const defaultValues = product.attribute_values.reduce(
        (acc: any, curr: any) => {
          if (curr) {
            acc[curr.attribute_id] = curr.value;
          }
          return acc;
        },
        {},
      );
      form.reset(defaultValues);
    }
  }, [product?.attribute_values, form]);

  const onSubmit = (data: any) => {
    const formattedData = Object.keys(data).map((key) => {
      const attribute = attributes.find(
        (a: any) => a.id === key && a.ui_component === "select",
      );
      const value = attribute?.possible_values?.find(
        (pv: any) => pv.id === data[key],
      )?.value;

      return (
        value && {
          [key]: value,
        }
      );
    });
    const payload = {
      ...data,
      ...Object.assign({}, ...formattedData.filter(Boolean)),
    };

    const values = Object.keys(payload).reduce(
      (acc: Array<Record<string, string>>, key) => {
        acc.push({ attribute_id: key, value: payload[key] });
        return acc;
      },
      [],
    );

    updateProduct(
      {
        additional_data: { values },
      },
      {
        onSuccess: () => {
          toast.success("Product updated successfully");
          setOpen(false);
        },
      },
    );
  };

  if (isLoading || isProductLoading) return <div>Loading...</div>;

  return (
    <>
      <div>
        <Container
          className="divide-y p-0"
          data-testid="product-additional-attributes-section"
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            data-testid="product-additional-attributes-header"
          >
            <Heading
              level="h2"
              data-testid="product-additional-attributes-title"
            >
              {t("products.additionalAttributes")}
            </Heading>
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      label: t("actions.edit"),
                      onClick: () => setOpen(true),
                      icon: <PencilSquare />,
                    },
                  ],
                },
              ]}
              data-testid="product-additional-attributes-action-menu"
            />
          </div>

          {product?.attribute_values?.map(
            (attribute: any) =>
              attribute && (
                <SectionRow
                  key={attribute.id}
                  title={attribute.attribute.name}
                  value={attribute.value}
                  data-testid={`product-additional-attribute-row-${attribute.attribute.name}`}
                />
              ),
          )}
        </Container>
      </div>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        data-testid="product-additional-attributes-drawer"
      >
        <Drawer.Content data-testid="product-additional-attributes-drawer-content">
          <Drawer.Header data-testid="product-additional-attributes-drawer-header">
            <Heading
              level="h2"
              data-testid="product-additional-attributes-drawer-title"
            >
              {t("products.additionalAttributes")}
            </Heading>
          </Drawer.Header>
          <Drawer.Body
            className="m-4 max-h-[calc(86vh)] overflow-y-auto py-2"
            data-testid="product-additional-attributes-drawer-body"
          >
            <FormProvider {...form}>
              <form
                id="product-additional-attributes-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="p-0"
                data-testid="product-additional-attributes-form"
              >
                {attributes.map((a: any) => (
                  <div
                    key={`form-field-${a.handle}-${a.id}`}
                    className="-mx-4 mb-4"
                    data-testid={`product-additional-attribute-field-${a.id}`}
                  >
                    <Label
                      className="mb-2 flex items-center gap-x-2"
                      data-testid={`product-additional-attribute-label-${a.id}`}
                    >
                      {a.name}
                      {a.description && (
                        <Tooltip
                          content={a.description}
                          data-testid={`product-additional-attribute-tooltip-${a.id}`}
                        >
                          <InformationCircleSolid />
                        </Tooltip>
                      )}
                    </Label>
                    <div
                      data-testid={`product-additional-attribute-input-${a.id}`}
                    >
                      <FormComponents
                        attribute={a}
                        field={{
                          name: a.id,
                          value: form.watch(a.id),
                          defaultValue: form.getValues(a.id),
                          onChange: (e: any) => {
                            form.setValue(a.id, e.target.value);
                          },
                        }}
                        data-testid={`product-additional-attribute-input-${a.id}-component`}
                      />
                    </div>
                  </div>
                ))}
              </form>
            </FormProvider>
          </Drawer.Body>
          <Drawer.Footer data-testid="product-additional-attributes-drawer-footer">
            <div
              className="flex items-center justify-end gap-x-2"
              data-testid="product-additional-attributes-form-actions"
            >
              <Drawer.Close
                asChild
                data-testid="product-additional-attributes-cancel-button-wrapper"
              >
                <Button
                  variant="secondary"
                  size="small"
                  data-testid="product-additional-attributes-cancel-button"
                >
                  {t("actions.cancel")}
                </Button>
              </Drawer.Close>
              <Button
                size="small"
                type="submit"
                form="product-additional-attributes-form"
                data-testid="product-additional-attributes-save-button"
              >
                {t("actions.save")}
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  );
};
