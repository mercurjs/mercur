import { zodResolver } from "@hookform/resolvers/zod";
import { Button, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { RouteFocusModal, useRouteModal } from "../../../../components/modals";
import { TabbedForm } from "../../../../components/tabbed-form/tabbed-form";
import { useBulkCreateOffers } from "../../../../hooks/api/offers";
import { useProducts } from "../../../../hooks/api/products";
import { useCurrentSeller } from "../../../../hooks/api/sellers";
import { useStockLocations } from "../../../../hooks/api/stock-locations";
import { CreateOfferCatalogueTab } from "./create-offer-catalogue";
import { CreateOfferStockLevelsAndPricesTab } from "./create-offer-stock-levels-and-prices";
import {
  CreateOfferFormValues,
  CreateOfferSchema,
  isVariantRowPublishable,
  OfferVariantRow,
  variantRowRequiresSku,
} from "./schema";

const DEFAULTS: CreateOfferFormValues = {
  selected_product_ids: [],
  variants: [],
};

const numericOrZero = (v: number | "" | undefined | null): number => {
  if (v === "" || v === null || v === undefined) return 0;
  return Number(v) || 0;
};

const attachErrorToRow = (
  message: string,
  rows: { row: OfferVariantRow; index: number; sku: string }[],
  form: { setError: (path: `variants.${number}.sku`, error: { type: string; message: string }) => void },
): boolean => {
  const variantMatch = message.match(/variant[^a-z0-9]*(?:with id[^a-z0-9]*)?['"`]?(var(?:iant)?_[A-Za-z0-9]+)/i);
  if (variantMatch) {
    const target = rows.find((r) => r.row.variant_id === variantMatch[1]);
    if (target) {
      form.setError(`variants.${target.index}.sku`, { type: "manual", message });
      return true;
    }
  }

  const skuMatch =
    message.match(/sku\s+['"`]([^'"`]+)['"`]/i) ||
    message.match(/duplicate[^']*['"`]([^'"`]+)['"`]/i);
  if (skuMatch) {
    const target = rows.find((r) => r.sku === skuMatch[1]);
    if (target) {
      form.setError(`variants.${target.index}.sku`, { type: "manual", message });
      return true;
    }
  }

  return false;
};

export const CreateOfferForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<CreateOfferFormValues>({
    defaultValues: DEFAULTS,
    resolver: zodResolver(CreateOfferSchema),
  });

  const { mutateAsync: bulkCreateOffers } = useBulkCreateOffers();
  const { currency_code } = useCurrentSeller();
  const { stock_locations } = useStockLocations({ limit: 100 });

  const locationIds = (stock_locations ?? []).map((l) => l.id);

  const selectedProductIds = form.watch("selected_product_ids") ?? [];
  const selectedProductIdsKey = selectedProductIds.join(",");
  const locationsKey = locationIds.join(",");

  // Fetch the selected products with their variants — the stock & prices
  // tab fans each product out to one row per variant (SPEC-009).
  const { products: fetchedProducts } = useProducts(
    {
      id: selectedProductIds,
      limit: selectedProductIds.length || 1,
      fields:
        "id,title,thumbnail,variants.id,variants.title,variants.sku",
    },
    { enabled: selectedProductIds.length > 0 },
  );

  // Hydrate `variants` from the selected products' variants. Keep
  // already-edited rows by indexing the prior array by variant_id.
  useEffect(() => {
    const locIds = locationsKey ? locationsKey.split(",") : [];

    const emptyPrices: Record<string, number | ""> = currency_code
      ? { [currency_code]: "" }
      : {};
    const emptyInventory = locIds.reduce<
      Record<
        string,
        { checked: boolean; quantity: number | ""; disabledToggle: boolean }
      >
    >((acc, locId) => {
      acc[locId] = { checked: false, quantity: "", disabledToggle: false };
      return acc;
    }, {});

    const existing = form.getValues("variants") ?? [];
    const existingByVariantId = new Map(
      existing.map((row) => [row.variant_id, row]),
    );

    const next: OfferVariantRow[] = [];
    for (const product of fetchedProducts ?? []) {
      for (const variant of product.variants ?? []) {
        const previous = existingByVariantId.get(variant.id);
        if (previous) {
          // Merge in any newly-arrived currencies / locations the row
          // didn't know about (e.g. store data arrived after build).
          next.push({
            ...previous,
            prices: { ...emptyPrices, ...(previous.prices ?? {}) },
            inventory: { ...emptyInventory, ...(previous.inventory ?? {}) },
          });
          continue;
        }
        next.push({
          variant_id: variant.id,
          product_id: product.id ?? "",
          product_title: product.title ?? "",
          variant_title: variant.title ?? variant.id,
          product_thumbnail: product.thumbnail ?? null,
          variant_sku: variant.sku ?? null,
          sku: variant.sku ?? "",
          shipping_profile_id: "",
          prices: { ...emptyPrices },
          inventory: { ...emptyInventory },
        });
      }
    }
    form.setValue("variants", next, { shouldDirty: false });
  }, [
    selectedProductIdsKey,
    fetchedProducts,
    currency_code,
    locationsKey,
    form,
  ]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const variants = values.variants ?? [];

    const publishable = variants.filter((v) => isVariantRowPublishable(v));

    if (publishable.length === 0) {
      toast.error(t("offers.validation.noPublishableRows"));
      return;
    }

    let hasValidationError = false;
    const skuSeen = new Map<string, number>();
    for (let i = 0; i < variants.length; i++) {
      const row = variants[i];
      if (!isVariantRowPublishable(row)) continue;

      const sku = (row.sku ?? "").trim();
      if (variantRowRequiresSku(row) && !sku) {
        form.setError(`variants.${i}.sku`, {
          type: "manual",
          message: t("offers.validation.skuRequired"),
        });
        hasValidationError = true;
        continue;
      }
      if (sku) {
        if (skuSeen.has(sku)) {
          form.setError(`variants.${i}.sku`, {
            type: "manual",
            message: t("offers.validation.duplicateSku"),
          });
          hasValidationError = true;
          continue;
        }
        skuSeen.set(sku, i);
      }

      if (!row.shipping_profile_id) {
        form.setError(`variants.${i}.shipping_profile_id`, {
          type: "manual",
          message: t("offers.validation.skuRequired"),
        });
        hasValidationError = true;
      }
    }

    if (hasValidationError) return;

    setIsSubmitting(true);

    const publishableRows: { row: OfferVariantRow; index: number; sku: string }[] = [];
    for (let i = 0; i < variants.length; i++) {
      const row = variants[i];
      if (!isVariantRowPublishable(row)) continue;
      const sku = (row.sku ?? "").trim() || row.variant_sku || row.variant_id;
      publishableRows.push({ row, index: i, sku });
    }

    const payloadOffers = publishableRows.map(({ row, sku }) => {
      const prices: { amount: number; currency_code: string }[] = [];
      if (currency_code) {
        prices.push({
          amount: numericOrZero(row.prices?.[currency_code]),
          currency_code,
        });
      }

      const stock_levels: { location_id: string; stocked_quantity: number }[] = [];
      for (const [locationId, level] of Object.entries(row.inventory ?? {})) {
        if (!level?.checked) continue;
        stock_levels.push({
          location_id: locationId,
          stocked_quantity: numericOrZero(level.quantity),
        });
      }

      return {
        sku,
        variant_id: row.variant_id,
        shipping_profile_id: row.shipping_profile_id,
        prices,
        inventory_items: [
          {
            title: row.variant_title,
            stock_levels,
          },
        ],
      };
    });

    try {
      await bulkCreateOffers({ offers: payloadOffers } as Parameters<
        typeof bulkCreateOffers
      >[0]);
      toast.success(t("offers.create.successToast"));
      handleSuccess("/offers");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const attributed = attachErrorToRow(message, publishableRows, form);
      if (!attributed) {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
      footer={({ isLastTab, onNext, isLoading }) => (
        <div className="flex items-center justify-end gap-x-2">
          <RouteFocusModal.Close asChild>
            <Button variant="secondary" size="small">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          {isLastTab ? (
            <Button
              key="publish-button"
              type="submit"
              variant="primary"
              size="small"
              isLoading={isLoading}
              data-testid="offer-create-publish"
            >
              {t("offers.create.publish")}
            </Button>
          ) : (
            <Button
              key="next-button"
              type="button"
              variant="primary"
              size="small"
              onClick={() => onNext()}
              disabled={(form.watch("selected_product_ids")?.length ?? 0) === 0}
            >
              {t("actions.continue")}
            </Button>
          )}
        </div>
      )}
    >
      <CreateOfferCatalogueTab />
      <CreateOfferStockLevelsAndPricesTab />
    </TabbedForm>
  );
};
