import { zodResolver } from "@hookform/resolvers/zod";
import i18n from "i18next";
import { Button, Input, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { CountrySelect } from "@components/inputs/country-select/country-select";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";
import { useUpdateSellerPaymentDetails } from "@hooks/api/sellers";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StorePaymentDetailsFormProps = {
  seller: Seller;
};

const StorePaymentDetailsSchema = zod.object({
  country_code: zod
    .string()
    .min(1, {
      message: i18n.t("store.paymentDetails.validation.countryRequired"),
    }),
  holder_name: zod
    .string()
    .min(1, {
      message: i18n.t("store.paymentDetails.validation.accountNameRequired"),
    }),
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
      country_code: details?.country_code ?? "",
      holder_name: details?.holder_name ?? "",
      bank_name: details?.bank_name ?? "",
      iban: details?.iban ?? "",
      bic: details?.bic ?? "",
      routing_number: details?.routing_number ?? "",
      account_number: details?.account_number ?? "",
    },
    resolver: zodResolver(StorePaymentDetailsSchema),
  });

  const selectedCountry = form.watch("country_code");

  const { mutateAsync, isPending } = useUpdateSellerPaymentDetails(seller.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    const isABA = values.country_code === "us";
    await mutateAsync(
      {
        country_code: values.country_code,
        holder_name: values.holder_name,
        bank_name: values.bank_name || null,
        iban: isABA ? null : values.iban || null,
        bic: isABA ? null : values.bic || null,
        routing_number: isABA ? values.routing_number || null : null,
        account_number: values.account_number || null,
      },
      {
        onSuccess: () => {
          toast.success(
            t("store.paymentDetails.edit.successToast"),
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
            name="country_code"
            render={({ field: { onChange, ref: _ref, ...field } }) => (
              <Form.Item>
                <Form.Label>
                  {t("store.paymentDetails.fields.countryCode")}
                </Form.Label>
                <Form.Control>
                  <CountrySelect {...field} onChange={onChange} />
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
                  {t("store.paymentDetails.fields.holderName")}
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
                  {t("store.paymentDetails.fields.bankName")}
                </Form.Label>
                <Form.Control>
                  <Input size="small" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          {selectedCountry === "us" ? (
            <div className="grid grid-cols-2 gap-4">
              <Form.Field
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.accountNumber")}
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
                name="routing_number"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.paymentDetails.fields.achRoutingNumber")}
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
                      {t("store.paymentDetails.fields.iban")}
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
                      {t("store.paymentDetails.fields.accountNumber")}
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
                      {t("store.paymentDetails.fields.swiftBic")}
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
