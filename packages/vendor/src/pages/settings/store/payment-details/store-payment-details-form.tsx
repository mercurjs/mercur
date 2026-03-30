import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Select, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { HttpTypes } from "@mercurjs/types";

type StorePaymentDetailsFormProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

const PAYMENT_TYPES = [
  { type: "iban", display_name: "International (IBAN/BIC)" },
  { type: "aba", display_name: "US Bank Account" },
] as const;

const StorePaymentDetailsSchema = zod.object({
  type: zod.string().default("iban"),
  holder_name: zod.string().min(1),
  bank_name: zod.string().optional().or(zod.literal("")),
  iban: zod.string().optional().or(zod.literal("")),
  bic: zod.string().optional().or(zod.literal("")),
  routing_number: zod.string().optional().or(zod.literal("")),
  account_number: zod.string().optional().or(zod.literal("")),
});

export const StorePaymentDetailsForm = ({
  seller,
}: StorePaymentDetailsFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const details = seller.payment_details;

  const form = useForm<zod.infer<typeof StorePaymentDetailsSchema>>({
    defaultValues: {
      type: details?.type ?? "iban",
      holder_name: details?.holder_name ?? "",
      bank_name: details?.bank_name ?? "",
      iban: details?.iban ?? "",
      bic: details?.bic ?? "",
      routing_number: details?.routing_number ?? "",
      account_number: details?.account_number ?? "",
    },
    resolver: zodResolver(StorePaymentDetailsSchema),
  });

  const selectedType = form.watch("type");

  // TODO: replace with actual update hook
  const { mutateAsync, isPending } = {
    isPending: false,
    mutateAsync: async (_payload: any, _options?: any) => {
      _options?.onSuccess?.();
    },
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const isABA = values.type === "aba";
    await mutateAsync(
      {
        type: values.type,
        holder_name: values.holder_name,
        bank_name: values.bank_name || null,
        iban: isABA ? null : values.iban || null,
        bic: isABA ? null : values.bic || null,
        routing_number: isABA ? values.routing_number || null : null,
        account_number: isABA ? values.account_number || null : null,
      },
      {
        onSuccess: () => {
          toast.success(
            t(
              "store.paymentDetails.edit.successToast",
              "Payment details updated",
            ),
          );
          handleSuccess();
        },
        onError: (error: Error) => {
          toast.error(error.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          <Form.Field
            control={form.control}
            name="type"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {t("store.paymentDetails.fields.type", "Type")}
                </Form.Label>
                <Form.Control>
                  <Select
                    size="small"
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <Select.Trigger>
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content>
                      {PAYMENT_TYPES.map((pt) => (
                        <Select.Item key={pt.type} value={pt.type}>
                          {pt.display_name}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="holder_name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>
                  {t(
                    "store.paymentDetails.fields.holderName",
                    "Account holder",
                  )}
                </Form.Label>
                <Form.Control>
                  <Input size="small" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="bank_name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("store.paymentDetails.fields.bankName", "Bank name")}
                </Form.Label>
                <Form.Control>
                  <Input size="small" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          {selectedType === "aba" ? (
            <div className="grid grid-cols-2 gap-4">
              <Form.Field
                control={form.control}
                name="routing_number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t(
                        "store.paymentDetails.fields.routingNumber",
                        "Routing number",
                      )}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t(
                        "store.paymentDetails.fields.accountNumber",
                        "Account number",
                      )}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Form.Field
                control={form.control}
                name="iban"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.iban", "IBAN")}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="bic"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.bic", "BIC / SWIFT")}
                    </Form.Label>
                    <Form.Control>
                      <Input size="small" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
          )}
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
