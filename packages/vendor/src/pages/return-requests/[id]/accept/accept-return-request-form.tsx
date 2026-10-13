import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Switch, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { Combobox } from "@components/inputs/combobox";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import {
  useAcceptReturnRequest,
  type VendorReturnRequest,
} from "@hooks/api/return-requests";
import { useShippingOptions } from "@hooks/api/shipping-options";
import { useStockLocations } from "@hooks/api/stock-locations";

const AcceptReturnRequestSchema = zod
  .object({
    return_required: zod.boolean(),
    location_id: zod.string().optional(),
    shipping_option_id: zod.string().optional(),
  })
  .refine((data) => !data.return_required || !!data.location_id, {
    path: ["location_id"],
    message: "required",
  });

type AcceptReturnRequestFormValues = zod.infer<typeof AcceptReturnRequestSchema>;

type ShippingOptionRow = {
  id: string;
  name: string;
  rules?: { attribute: string; value: string }[] | null;
  service_zone?: {
    fulfillment_set?: { location?: { id: string } | null } | null;
  } | null;
};

export const AcceptReturnRequestForm = ({
  returnRequest,
}: {
  returnRequest: VendorReturnRequest;
}) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<AcceptReturnRequestFormValues>({
    resolver: zodResolver(AcceptReturnRequestSchema),
    defaultValues: {
      return_required: true,
      location_id: "",
      shipping_option_id: "",
    },
  });

  const returnRequired = form.watch("return_required");
  const locationId = form.watch("location_id");

  const { stock_locations: stockLocations = [] } = useStockLocations({
    limit: 999,
  });
  const { shipping_options: shippingOptions = [] } = useShippingOptions({
    limit: 999,
    fields: "*prices,+service_zone.fulfillment_set.location.id",
  }) as { shipping_options?: ShippingOptionRow[] };

  const returnShippingOptions = shippingOptions.filter(
    (option) =>
      (locationId
        ? option.service_zone?.fulfillment_set?.location?.id === locationId
        : true) &&
      !!option.rules?.find(
        (rule) => rule.attribute === "is_return" && rule.value === "true",
      ),
  );

  const { mutateAsync, isPending } = useAcceptReturnRequest(
    returnRequest.id,
    returnRequest.order_id,
  );

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        return_required: data.return_required,
        location_id: data.return_required ? data.location_id : undefined,
        shipping_option_id:
          data.return_required && data.shipping_option_id
            ? data.shipping_option_id
            : undefined,
      },
      {
        onSuccess: () => {
          toast.success(t("returnRequests.accept.successToast"));
          handleSuccess();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-6">
            <Form.Field
              control={form.control}
              name="return_required"
              render={({ field: { value, onChange, ...field } }) => (
                <Form.Item>
                  <div className="flex flex-col gap-y-2">
                    <div className="flex items-start justify-between">
                      <Form.Label>
                        {t("returnRequests.accept.returnRequired")}
                      </Form.Label>
                      <Form.Control>
                        <Switch
                          {...field}
                          checked={value}
                          onCheckedChange={onChange}
                        />
                      </Form.Control>
                    </div>
                    <Form.Hint>
                      {t("returnRequests.accept.returnRequiredHint")}
                    </Form.Hint>
                  </div>
                </Form.Item>
              )}
            />

            {returnRequired && (
              <>
                <Form.Field
                  control={form.control}
                  name="location_id"
                  render={({ field: { value, onChange, ...field } }) => (
                    <Form.Item>
                      <Form.Label>{t("orders.returns.location")}</Form.Label>
                      <Form.Hint className="!mt-1">
                        {t("orders.returns.locationHint")}
                      </Form.Hint>
                      <Form.Control>
                        <Combobox
                          {...field}
                          value={value || undefined}
                          onChange={(v) => {
                            onChange(v ?? "");
                            form.setValue("shipping_option_id", "");
                          }}
                          options={stockLocations.map((location) => ({
                            label: location.name,
                            value: location.id,
                          }))}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                <Form.Field
                  control={form.control}
                  name="shipping_option_id"
                  render={({ field: { value, onChange, ...field } }) => (
                    <Form.Item>
                      <Form.Label optional>
                        {t("orders.returns.inboundShipping")}
                      </Form.Label>
                      <Form.Hint className="!mt-1">
                        {t("orders.returns.inboundShippingHint")}
                      </Form.Hint>
                      <Form.Control>
                        <Combobox
                          {...field}
                          value={value || undefined}
                          onChange={(v) => onChange(v ?? "")}
                          disabled={!locationId}
                          options={returnShippingOptions.map((option) => ({
                            label: option.name,
                            value: option.id,
                          }))}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </>
            )}
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("returnRequests.accept.action")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
