import type { HttpTypes } from "@medusajs/types";
import { Button, Input, Text, toast } from "@medusajs/ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Form } from "@/components/common/form";
import { RouteDrawer, useRouteModal } from "@/components/modals";
import { KeyboundForm } from "@/components/utilities/keybound-form";
import { useUpdateInventoryLevel } from "@/hooks/api/inventory";
import { castNumber } from "@/lib/cast-number";
import { sanitizeNumberInput } from "@/lib/sanitize-number-input";

type AdjustInventoryFormProps = {
  item: HttpTypes.AdminInventoryItem;
  level: HttpTypes.AdminInventoryLevel;
  location: HttpTypes.AdminStockLocation;
};

const AttributeGridRow = ({
  title,
  value,
  testId,
}: {
  title: string;
  value: string | number;
  testId?: string;
}) => {
  return (
    <div className="grid grid-cols-2 divide-x" data-testid={testId ? `${testId}-row` : undefined}>
      <Text className="px-2 py-1.5" size="small" leading="compact" data-testid={testId ? `${testId}-label` : undefined}>
        {title}
      </Text>
      <Text className="px-2 py-1.5" size="small" leading="compact" data-testid={testId ? `${testId}-value` : undefined}>
        {value}
      </Text>
    </div>
  );
};

export const AdjustInventoryForm = ({
  item,
  level,
  location,
}: AdjustInventoryFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const AdjustInventorySchema = z
    .object({
      stocked_quantity: z.union([z.number(), z.string()]),
    })
    .superRefine((data, ctx) => {
      const quantity = data.stocked_quantity
        ? castNumber(data.stocked_quantity)
        : null;

      if (quantity === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_type,
          expected: "number",
          received: "undefined",
          path: ["stocked_quantity"],
        });

        return;
      }

      if (quantity < level.reserved_quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("inventory.adjustInventory.errors.stockedQuantity", {
            quantity: level.reserved_quantity,
          }),
          path: ["stocked_quantity"],
        });
      }
    });

  const form = useForm<z.infer<typeof AdjustInventorySchema>>({
    defaultValues: {
      stocked_quantity: level.stocked_quantity,
    },
    resolver: zodResolver(AdjustInventorySchema),
  });

  const stockedQuantityUpdate = useWatch({
    control: form.control,
    name: "stocked_quantity",
  });

  const availableQuantity = stockedQuantityUpdate
    ? castNumber(stockedQuantityUpdate) - level.reserved_quantity
    : 0 - level.reserved_quantity;

  const { mutateAsync, isPending: isLoading } = useUpdateInventoryLevel(
    item.id,
    level.location_id,
  );

  const handleSubmit = form.handleSubmit(async (value) => {
    await mutateAsync(
      {
        stocked_quantity: castNumber(value.stocked_quantity),
      },
      {
        onSuccess: () => {
          toast.success(t("inventory.toast.updateLevel"));
          handleSuccess();
        },
        onError: (e) => {
          toast.error(e.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form} data-testid="inventory-adjust-inventory-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="inventory-adjust-inventory-keybound-form"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-auto" data-testid="inventory-adjust-inventory-form-body">
          <div className="grid grid-rows-4 divide-y rounded-lg border text-ui-fg-subtle shadow-elevation-card-rest" data-testid="inventory-adjust-inventory-form-info-grid">
            <AttributeGridRow
              title={t("fields.title")}
              value={item.title ?? "-"}
              testId="inventory-adjust-inventory-form-item-title"
            />
            <AttributeGridRow 
              title={t("fields.sku")} 
              value={item.sku!} 
              testId="inventory-adjust-inventory-form-item-sku"
            />
            <AttributeGridRow
              title={t("locations.domain")}
              value={location.name}
              testId="inventory-adjust-inventory-form-location"
            />
            <AttributeGridRow
              title={t("inventory.reserved")}
              value={level.reserved_quantity}
              testId="inventory-adjust-inventory-form-reserved"
            />
            <AttributeGridRow
              title={t("inventory.available")}
              value={availableQuantity}
              testId="inventory-adjust-inventory-form-available"
            />
          </div>
          <Form.Field
            control={form.control}
            name="stocked_quantity"
            render={({ field: { onChange, value, ...field } }) => {
              return (
                <Form.Item data-testid="inventory-adjust-inventory-form-stocked-quantity-item">
                  <Form.Label data-testid="inventory-adjust-inventory-form-stocked-quantity-label">{t("fields.inStock")}</Form.Label>
                  <Form.Control data-testid="inventory-adjust-inventory-form-stocked-quantity-control">
                    <div data-testid="inventory-adjust-inventory-form-stocked-quantity-input-wrapper">
                      <Input
                        type="number"
                        value={value}
                        onChange={onChange}
                        onKeyDown={(e) => sanitizeNumberInput(e, [",", "."])}
                        {...field}
                        data-testid="inventory-adjust-inventory-form-stocked-quantity-input"
                      />
                    </div>
                  </Form.Control>
                  <Form.ErrorMessage data-testid="inventory-adjust-inventory-form-stocked-quantity-error" />
                </Form.Item>
              );
            }}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer data-testid="inventory-adjust-inventory-form-footer">
          <div className="flex items-center justify-end gap-x-2" data-testid="inventory-adjust-inventory-form-footer-actions">
            <RouteDrawer.Close asChild data-testid="inventory-adjust-inventory-form-cancel-button-wrapper">
              <Button variant="secondary" size="small" data-testid="inventory-adjust-inventory-form-cancel-button">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isLoading} data-testid="inventory-adjust-inventory-form-save-button">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
