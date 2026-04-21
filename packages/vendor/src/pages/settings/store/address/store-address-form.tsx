import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { CountrySelect } from "@components/inputs/country-select";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { HttpTypes } from "@mercurjs/types";
import { useUpdateSellerAddress } from "@hooks/api";

type StoreAddressFormProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

const StoreAddressSchema = zod.object({
  name: zod.string().min(1),
  address_1: zod.string().optional().or(zod.literal("")),
  address_2: zod.string().optional().or(zod.literal("")),
  city: zod.string().optional().or(zod.literal("")),
  province: zod.string().optional().or(zod.literal("")),
  postal_code: zod.string().optional().or(zod.literal("")),
  country_code: zod.string().min(2).max(2),
});

export const StoreAddressForm = ({ seller }: StoreAddressFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const address = seller.address;

  const form = useForm<zod.infer<typeof StoreAddressSchema>>({
    defaultValues: {
      name: (address as any)?.name ?? "",
      address_1: address?.address_1 ?? "",
      address_2: address?.address_2 ?? "",
      city: address?.city ?? "",
      province: address?.province ?? "",
      postal_code: address?.postal_code ?? "",
      country_code: address?.country_code ?? "",
    },
    resolver: zodResolver(StoreAddressSchema),
  });

  const { mutateAsync, isPending } = useUpdateSellerAddress(seller.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        name: values.name,
        address_1: values.address_1 || null,
        address_2: values.address_2 || null,
        city: values.city || null,
        province: values.province || null,
        postal_code: values.postal_code || null,
        country_code: values.country_code,
      } as any,
      {
        onSuccess: () => {
          toast.success(
            t("store.address.edit.successToast"),
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
            name="name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("store.address.nameLabel")}</Form.Label>
                <Form.Control>
                  <Input
                    size="small"
                    placeholder={t("store.address.namePlaceholder")}
                    {...field}
                  />
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
          <Form.Field
            control={form.control}
            name="address_2"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>{t("fields.address2")}</Form.Label>
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
              name="postal_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.postalCode")}</Form.Label>
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
