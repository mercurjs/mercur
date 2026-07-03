import { HttpTypes } from "@medusajs/types";
import { SellerDTO } from "@mercurjs/types";
import { Button, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "../../../../../components/common/form";
import { SwitchBox } from "../../../../../components/common/switch-box";
import { Combobox } from "../../../../../components/inputs/combobox";
import { RouteDrawer, useRouteModal } from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { i18n } from "../../../../../components/utilities/i18n/i18n";

import {
  useLinkProductSellers,
  useUpdateProduct,
} from "../../../../../hooks/api/products";
import { useComboboxData } from "../../../../../hooks/use-combobox-data";
import { sdk } from "../../../../../lib/client";
import { SingleCategoryCombobox } from "../../../common/components/category-combobox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type ProductOrganizationFormProps = {
  product: HttpTypes.AdminProduct & { sellers?: SellerDTO[] };
};

const ProductOrganizationSchema = zod
  .object({
    type_id: zod.string().nullable(),
    collection_id: zod.string().nullable(),
    category_id: zod.string().optional(),
    tag_ids: zod.array(zod.string()),
    globally_available: zod.boolean(),
    seller_ids: zod.array(zod.string()),
  })
  .superRefine((data, ctx) => {
    if (!data.globally_available && !data.seller_ids.length) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["seller_ids"],
        message: i18n.t("products.create.errors.requiredStore"),
      });
    }
  });

export const ProductOrganizationForm = ({
  product,
}: ProductOrganizationFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const collections = useComboboxData({
    queryKey: ["product_collections"],
    queryFn: (params) => sdk.admin.collections.query(params),
    getOptions: (data) =>
      data.collections.map((collection) => ({
        label: collection.title!,
        value: collection.id!,
      })),
  });

  const types = useComboboxData({
    queryKey: ["product_types"],
    queryFn: (params) => sdk.admin.productTypes.query(params),
    getOptions: (data) =>
      data.product_types.map((type) => ({
        label: type.value,
        value: type.id,
      })),
  });

  const tags = useComboboxData({
    queryKey: ["product_tags"],
    queryFn: (params) => sdk.admin.productTags.query(params),
    getOptions: (data) =>
      data.product_tags.map((tag) => ({
        label: tag.value,
        value: tag.id,
      })),
  });

  const sellers = useComboboxData({
    queryKey: ["sellers"],
    queryFn: (params) => sdk.admin.sellers.query(params),
    getOptions: (data) =>
      data.sellers.map((seller: { id: string; name: string }) => ({
        label: seller.name,
        value: seller.id,
      })),
  });

  const initialSellerIds = product.sellers?.map((s) => s.id) ?? [];

  const form = useForm({
    defaultValues: {
      type_id: product.type_id ?? "",
      collection_id: product.collection_id ?? "",
      category_id: product.categories?.[0]?.id ?? "",
      tag_ids: product.tags?.map((t) => t.id) || [],
      globally_available: initialSellerIds.length === 0,
      seller_ids: initialSellerIds,
    },
    resolver: zodResolver(ProductOrganizationSchema),
  });

  const isGloballyAvailable = form.watch("globally_available");

  const { mutateAsync, isPending } = useUpdateProduct(product.id);
  const { mutateAsync: linkSellers, isPending: isLinkingSellers } =
    useLinkProductSellers(product.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    const desiredSellerIds = data.globally_available ? [] : data.seller_ids;
    const add = desiredSellerIds.filter(
      (id) => !initialSellerIds.includes(id),
    );
    const remove = initialSellerIds.filter(
      (id) => !desiredSellerIds.includes(id),
    );

    await mutateAsync(
      {
        type_id: data.type_id || null,
        collection_id: data.collection_id || null,
        categories: data.category_id ? [{ id: data.category_id }] : [],
        tags: data.tag_ids?.map((t) => ({ id: t })),
      },
      {
        onSuccess: async ({ product }) => {
          if (add.length || remove.length) {
            await linkSellers({ add, remove });
          }

          toast.success(
            t("products.organization.edit.toasts.success", {
              title: product.title,
            }),
          );
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form} data-testid="product-organization-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col"
        data-testid="product-organization-keybound-form"
      >
        <RouteDrawer.Body data-testid="product-organization-form-body">
          <div
            className="flex h-full flex-col gap-y-4"
            data-testid="product-organization-form-fields"
          >
            <Form.Field
              control={form.control}
              name="type_id"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-organization-form-type-item">
                    <Form.Label
                      optional
                      data-testid="product-organization-form-type-label"
                    >
                      {t("products.fields.type.label")}
                    </Form.Label>
                    <Form.Control data-testid="product-organization-form-type-control">
                      <Combobox
                        {...field}
                        options={types.options}
                        searchValue={types.searchValue}
                        onSearchValueChange={types.onSearchValueChange}
                        fetchNextPage={types.fetchNextPage}
                        data-testid="product-organization-form-type-combobox"
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-organization-form-type-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="collection_id"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-organization-form-collection-item">
                    <Form.Label
                      optional
                      data-testid="product-organization-form-collection-label"
                    >
                      {t("products.fields.collection.label")}
                    </Form.Label>
                    <Form.Control data-testid="product-organization-form-collection-control">
                      <Combobox
                        {...field}
                        multiple={false}
                        options={collections.options}
                        onSearchValueChange={collections.onSearchValueChange}
                        searchValue={collections.searchValue}
                        data-testid="product-organization-form-collection-combobox"
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-organization-form-collection-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="category_id"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-organization-form-category-item">
                    <Form.Label
                      data-testid="product-organization-form-category-label"
                    >
                      {t("fields.category")}
                    </Form.Label>
                    <Form.Control data-testid="product-organization-form-categories-control">
                      <SingleCategoryCombobox
                        {...field}
                        data-testid="product-organization-form-categories-combobox"
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-organization-form-categories-error" />
                  </Form.Item>
                );
              }}
            />
            <Form.Field
              control={form.control}
              name="tag_ids"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="product-organization-form-tags-item">
                    <Form.Label
                      optional
                      data-testid="product-organization-form-tags-label"
                    >
                      {t("products.fields.tags.label")}
                    </Form.Label>
                    <Form.Control data-testid="product-organization-form-tags-control">
                      <Combobox
                        {...field}
                        multiple
                        options={tags.options}
                        onSearchValueChange={tags.onSearchValueChange}
                        searchValue={tags.searchValue}
                        data-testid="product-organization-form-tags-combobox"
                      />
                    </Form.Control>
                    <Form.ErrorMessage data-testid="product-organization-form-tags-error" />
                  </Form.Item>
                );
              }}
            />
            <SwitchBox
              control={form.control}
              name="globally_available"
              label={t("products.fields.globally_available.label")}
              description={t("products.fields.globally_available.hint")}
              optional
              data-testid="product-organization-form-globally-available-switch"
            />
            {!isGloballyAvailable && (
              <Form.Field
                control={form.control}
                name="seller_ids"
                render={({ field }) => {
                  return (
                    <Form.Item data-testid="product-organization-form-stores-item">
                      <Form.Label data-testid="product-organization-form-stores-label">
                        {t("products.fields.stores.label")}
                      </Form.Label>
                      <Form.Control data-testid="product-organization-form-stores-control">
                        <Combobox
                          {...field}
                          value={field.value ?? []}
                          options={sellers.options}
                          searchValue={sellers.searchValue}
                          onSearchValueChange={sellers.onSearchValueChange}
                          fetchNextPage={sellers.fetchNextPage}
                          data-testid="product-organization-form-stores-combobox"
                        />
                      </Form.Control>
                      <Form.ErrorMessage data-testid="product-organization-form-stores-error" />
                    </Form.Item>
                  );
                }}
              />
            )}
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="product-organization-form-footer">
          <div
            className="flex items-center justify-end gap-x-2"
            data-testid="product-organization-form-footer-actions"
          >
            <RouteDrawer.Close
              asChild
              data-testid="product-organization-form-cancel-button-wrapper"
            >
              <Button
                size="small"
                variant="secondary"
                data-testid="product-organization-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button
              size="small"
              type="submit"
              isLoading={isPending || isLinkingSellers}
              data-testid="product-organization-form-save-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
