import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { CountrySelect } from "../../../../components/inputs/country-select";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";
import { useUpdateSellerAddress } from "@hooks/api/sellers";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreAddressEditFormProps = {
  seller: Seller;
};

const StoreAddressSchema = zod.object({
  first_name: zod.string().min(1),
  last_name: zod.string().min(1),
  address_1: zod.string().optional().or(zod.literal("")),
  city: zod.string().optional().or(zod.literal("")),
  province: zod.string().optional().or(zod.literal("")),
  postal_code: zod.string().min(1),
  country_code: zod.string().min(2).max(2),
  phone: zod.string().min(1),
});

export const StoreAddressEditForm = ({
  seller,
}: StoreAddressEditFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const address = seller.address;

  const form = useForm<zod.infer<typeof StoreAddressSchema>>({
    defaultValues: {
      first_name: address?.first_name ?? "",
      last_name: address?.last_name ?? "",
      address_1: address?.address_1 ?? "",
      city: address?.city ?? "",
      province: address?.province ?? "",
      postal_code: address?.postal_code ?? "",
      country_code: address?.country_code ?? "",
      phone: address?.phone ?? "",
    },
    resolver: zodResolver(StoreAddressSchema),
  });

  const { mutateAsync, isPending } = useUpdateSellerAddress(seller.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        first_name: values.first_name,
        last_name: values.last_name,
        address_1: values.address_1 || null,
        city: values.city || null,
        province: values.province || null,
        postal_code: values.postal_code,
        country_code: values.country_code,
        phone: values.phone,
      },
      {
        onSuccess: () => {
          toast.success(
            t("store.address.edit.successToast", "Address updated"),
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
          <div className="grid grid-cols-2 gap-4">
            <Form.Field
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.firstName")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.lastName")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
          <Form.Field
            control={form.control}
            name="address_1"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>{t("fields.address")}</Form.Label>
                <Form.Control>
                  <Input size="small" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Form.Field
              control={form.control}
              name="city"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.city")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="province"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.state")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Form.Field
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.postalCode")}</Form.Label>
                  <Form.Control>
                    <Input size="small" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="country_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.country")}</Form.Label>
                  <Form.Control>
                    <CountrySelect {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
          <Form.Field
            control={form.control}
            name="phone"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.phone")}</Form.Label>
                <Form.Control>
                  <Input size="small" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
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
