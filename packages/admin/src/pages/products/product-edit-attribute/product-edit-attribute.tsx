import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, Label, Textarea, toast } from "@medusajs/ui";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import * as zod from "zod";

import { ProductAttributeDTO } from "@mercurjs/types";
import { ChipInput } from "../../../components/inputs/chip-input";
import { RouteDrawer, useRouteModal } from "../../../components/modals";
import { KeyboundForm } from "../../../components/utilities/keybound-form";
import { useProduct, useUpdateProductScopedAttribute } from "../../../hooks/api/products";
import { PRODUCT_DETAIL_QUERY } from "../constants";

const EditAttributeSchema = zod.object({
  title: zod.string().min(1).optional(),
  values: zod.union([zod.string(), zod.array(zod.string())]),
});

type EditAttributeFormValues = zod.infer<typeof EditAttributeSchema>;

type EditAttributeFormProps = {
  productId: string;
  attribute: ProductAttributeDTO;
};

const EditAttributeForm = ({
  productId,
  attribute,
}: EditAttributeFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const isProductScoped = !!attribute.product_id;
  const isSelectType = ["single_select", "multi_select"].includes(attribute.type);

  const currentValues = attribute.values?.map((v) => v.name) ?? [];

  const form = useForm<EditAttributeFormValues>({
    defaultValues: {
      title: attribute.name ?? "",
      values: isSelectType ? currentValues : currentValues.join(", "),
    },
    resolver: zodResolver(EditAttributeSchema),
  });

  const { mutateAsync, isPending } = useUpdateProductScopedAttribute(
    productId,
    attribute.id
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    const values = Array.isArray(data.values)
      ? data.values
      : data.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);

    const payload: Record<string, any> = {
      values: values.map((v, i) => ({
        name: v,
        rank: i,
      })),
    };

    if (isProductScoped) {
      payload.name = data.title;
    }

    await mutateAsync(payload, {
      onSuccess: () => {
        toast.success(
          t("attributes.edit.successToast", {
            name: isProductScoped ? data.title : attribute.name,
          })
        );
        handleSuccess();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col"
      >
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <div className="bg-ui-bg-component shadow-elevation-card-rest rounded-xl p-1.5">
              <div className="grid grid-cols-[min-content,1fr] items-center gap-1.5">
                {isProductScoped && (
                  <>
                    <div className="flex items-center px-2 py-1.5">
                      <Label
                        size="xsmall"
                        weight="plus"
                        className="text-ui-fg-subtle"
                      >
                        {t("fields.title")}
                      </Label>
                    </div>
                    <Input
                      className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                      {...form.register("title")}
                      placeholder={t(
                        "products.create.attributes.titlePlaceholder"
                      )}
                    />
                  </>
                )}
                <div className="flex items-center px-2 py-1.5">
                  <Label
                    size="xsmall"
                    weight="plus"
                    className="text-ui-fg-subtle"
                  >
                    {t("fields.values")}
                  </Label>
                </div>
                <Controller
                  control={form.control}
                  name="values"
                  render={({ field: { onChange, value, ...field } }) =>
                    isSelectType ? (
                      <ChipInput
                        {...field}
                        variant="contrast"
                        value={Array.isArray(value) ? value : []}
                        onChange={onChange}
                        placeholder={t(
                          "products.create.attributes.valuePlaceholder"
                        )}
                      />
                    ) : (
                      <Textarea
                        {...field}
                        className="bg-ui-bg-field-component hover:bg-ui-bg-field-component-hover"
                        value={
                          Array.isArray(value)
                            ? value.join(", ")
                            : value ?? ""
                        }
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={t(
                          "products.create.attributes.valuePlaceholder"
                        )}
                      />
                    )
                  }
                />
              </div>
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};

export const ProductEditAttribute = () => {
  const { id, attribute_id } = useParams();
  const { t } = useTranslation();

  const { product, isPending, isError, error } = useProduct(
    id!,
    PRODUCT_DETAIL_QUERY
  );

  const attribute = product?.attributes?.find(
    (a: ProductAttributeDTO) => a.id === attribute_id
  );

  if (isError) {
    throw error;
  }

  if (isPending || !product) {
    return null;
  }

  if (!attribute) {
    throw new Response(
      JSON.stringify({
        message: `Attribute ${attribute_id} not found on product ${id}`,
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{attribute.name}</Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("attributes.edit.header", "Edit attribute")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      <EditAttributeForm productId={id!} attribute={attribute} />
    </RouteDrawer>
  );
};
