import { useMemo } from "react";
import { HttpTypes } from "@medusajs/types";
import { Button, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { Combobox } from "@components/inputs/combobox";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { useUpdateProduct } from "@hooks/api/products";
import { useComboboxData } from "@hooks/use-combobox-data";
import { sdk } from "@lib/client";
import { CategoryCombobox } from "@pages/products/common/components/category-combobox";
import { ExtendedAdminProduct } from "@custom-types/products";

type ProductOrganizationFormProps = {
  product: ExtendedAdminProduct;
};

type ProductWithAdditionalData = ExtendedAdminProduct & {
  additional_data?: {
    secondary_categories?: Array<{
      sec_cat_product_key?: string;
      category_ids?: string[];
      secondary_categories_ids?: string[];
    }>;
  };
  secondary_categories?: HttpTypes.AdminProductCategory[];
};

const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));
const isCategoryId = (id: string) => id.startsWith("pcat_");
const isSecondaryCategoryRelationId = (id: string) => id.startsWith("sec_cat_");

const getSecondaryCategoriesSnapshot = (product: ProductWithAdditionalData) => {
  const relationEntries = (product.secondary_categories ?? []) as any[];

  const relationSecCatIds = relationEntries
    .map((cat: any) => cat?.id)
    .filter((id: any): id is string => typeof id === "string" && isSecondaryCategoryRelationId(id));

  const relationCategoryIds = relationEntries
    .map((cat: any) => {
      const candidates = [
        cat?.id, cat?.category_id, cat?.product_category_id,
        cat?.product_category?.id, cat?.category?.id,
      ].filter(Boolean) as string[];
      return candidates.find(isCategoryId);
    })
    .filter((id): id is string => Boolean(id));

  const entries = product.additional_data?.secondary_categories ?? [];
  const additionalCategoryIds = entries.flatMap((entry) => (entry as any)?.category_ids ?? []);
  const additionalIds = entries.flatMap((entry) => (entry as any)?.secondary_categories_ids ?? []);
  const additionalCategoryIdsFromSecondaryIds = additionalIds.filter(isCategoryId);
  const additionalSecCatIds = additionalIds.filter(isSecondaryCategoryRelationId);

  const categoryIds = uniq(
    relationCategoryIds.length
      ? relationCategoryIds
      : additionalCategoryIds.length
        ? additionalCategoryIds
        : additionalCategoryIdsFromSecondaryIds
  );

  const secCatIdByCategoryId = new Map<string, string>();
  relationEntries.forEach((entry: any) => {
    const secCatId = typeof entry?.id === "string" && isSecondaryCategoryRelationId(entry.id) ? entry.id : undefined;
    const catIdCandidates = [entry?.category_id, entry?.product_category_id, entry?.product_category?.id, entry?.category?.id].filter(Boolean) as string[];
    const catId = catIdCandidates.find(isCategoryId);
    if (secCatId && catId) secCatIdByCategoryId.set(catId, secCatId);
  });

  if (additionalCategoryIds.length > 0 && additionalSecCatIds.length > 0 && additionalCategoryIds.length === additionalSecCatIds.length) {
    for (let i = 0; i < additionalCategoryIds.length; i++) {
      secCatIdByCategoryId.set(additionalCategoryIds[i], additionalSecCatIds[i]);
    }
  }

  return { categoryIds, secCatIds: uniq([...relationSecCatIds, ...additionalSecCatIds]), secCatIdByCategoryId };
};

const diff = (next: string[], prev: string[]) => {
  const prevSet = new Set(prev);
  return next.filter((id) => !prevSet.has(id));
};

const ProductOrganizationSchema = zod.object({
  type_id: zod.string().nullable(),
  collection_id: zod.string().nullable(),
  categories: zod.array(zod.string()).min(1),
  secondary_categories: zod.array(zod.string()).optional(),
  tag_ids: zod.array(zod.string()).nullable(),
});

export const ProductOrganizationForm = ({ product }: ProductOrganizationFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const collections = useComboboxData({
    queryKey: ["product_collections"],
    queryFn: (params) => sdk.vendor.collections.query(params as any),
    getOptions: (data) =>
      data.collections.map((collection: any) => ({
        label: collection.title!,
        value: collection.id!,
      })),
  });

  const types = useComboboxData({
    queryKey: ["product_types"],
    queryFn: (params) =>
      fetchQuery("/vendor/product-types", {
        method: "GET",
        query: params as { [key: string]: string | number },
      }),
    getOptions: (data) =>
      data.product_types.map((type: any) => ({
        label: type.value,
        value: type.id,
      })),
  });

  const tags = useComboboxData({
    queryKey: ["product_tags"],
    queryFn: (params) =>
      fetchQuery("/vendor/product-tags", {
        method: "GET",
        query: params as { [key: string]: string | number },
      }),
    getOptions: (data) =>
      data.product_tags.map((tag: any) => ({
        label: tag.value,
        value: tag.id,
      })),
  });

  const secondarySnapshot = useMemo(
    () => getSecondaryCategoriesSnapshot(product as ProductWithAdditionalData),
    [product]
  );

  const form = useForm({
    defaultValues: {
      type_id: product.type_id ?? "",
      collection_id: product.collection_id ?? "",
      categories: product.categories?.map((cat) => cat.id) || [],
      secondary_categories: secondarySnapshot.categoryIds,
      tag_ids: product.tags?.map((t) => t.id) || [],
    },
    resolver: zodResolver(ProductOrganizationSchema),
  });

  const { mutateAsync, isPending } = useUpdateProduct(product.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    const nextCategoryIds = uniq(Array.isArray(data.secondary_categories) ? data.secondary_categories : []);
    const currentCategoryIds = secondarySnapshot.categoryIds;
    const addCategoryIds = diff(nextCategoryIds, currentCategoryIds);
    const removedCategoryIds = diff(currentCategoryIds, nextCategoryIds);

    const existingSecCatIds = secondarySnapshot.secCatIds;
    const removeSecCatIdsFromMap = removedCategoryIds
      .map((catId) => secondarySnapshot.secCatIdByCategoryId.get(catId))
      .filter((id): id is string => Boolean(id));
    const canMapAllRemovals = removedCategoryIds.length === removeSecCatIdsFromMap.length;
    const removeSecCatIds = uniq(
      removedCategoryIds.length === 0 ? [] : canMapAllRemovals ? removeSecCatIdsFromMap : existingSecCatIds
    );

    const hasSecondaryCatsChanges = addCategoryIds.length > 0 || removedCategoryIds.length > 0;

    const payload = {
      type_id: data.type_id || null,
      collection_id: data.collection_id || null,
      categories: data.categories?.map((id) => ({ id })) || [],
      tags: data.tag_ids?.map((t) => ({ id: t })) ?? [],
      ...(hasSecondaryCatsChanges && {
        additional_data: {
          secondary_categories: [
            {
              product_id: product.id,
              add: canMapAllRemovals ? addCategoryIds : nextCategoryIds,
              remove: removeSecCatIds,
              secondary_categories_ids: existingSecCatIds,
            },
          ],
        },
      }),
    } as HttpTypes.AdminUpdateProduct;

    await mutateAsync(payload as any, {
      onSuccess: ({ product }: any) => {
        toast.success(t("products.organization.edit.toasts.success", { title: product?.title }));
        handleSuccess();
      },
      onError: (error: any) => {
        toast.error(error.message);
      },
    });
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col">
        <RouteDrawer.Body>
          <div className="flex h-full flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="tag_ids"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("products.fields.tags.label")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      multiple
                      options={tags.options}
                      onSearchValueChange={tags.onSearchValueChange}
                      searchValue={tags.searchValue}
                      allowClear
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="type_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("products.fields.type.label")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      options={types.options}
                      searchValue={types.searchValue}
                      onSearchValueChange={types.onSearchValueChange}
                      fetchNextPage={types.fetchNextPage}
                      allowClear
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="categories"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label tooltip={t("products.fields.primaryCategory.tooltip")}>
                    {t("products.fields.primaryCategory.label")}
                  </Form.Label>
                  <Form.Control>
                    <CategoryCombobox {...field} isSingleSelect allowClear={false} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="secondary_categories"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("products.fields.secondaryCategories.label", "Secondary Categories")}
                  </Form.Label>
                  <Form.Control>
                    <CategoryCombobox {...field} value={field.value || []} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="collection_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("products.fields.collection.label")}</Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      multiple={false}
                      options={collections.options}
                      onSearchValueChange={collections.onSearchValueChange}
                      searchValue={collections.searchValue}
                      allowClear
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
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
