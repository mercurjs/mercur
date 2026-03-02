import { Button, Input, toast } from "@medusajs/ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Form } from "@components/common/form";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";

import { useUpdateSeller } from "@hooks/api/sellers";
import { HttpTypes } from "@mercurjs/types";

type SellerAddressEditFormProps = {
  seller: HttpTypes.AdminSellerResponse["seller"];
};

const SellerAddressEditSchema = z.object({
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country_code: z.string().optional(),
  postal_code: z.string().optional(),
});

export const SellerAddressEditForm = ({
  seller,
}: SellerAddressEditFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<z.infer<typeof SellerAddressEditSchema>>({
    defaultValues: {
      address_1: seller?.address_1 || undefined,
      address_2: seller?.address_2 || undefined,
      city: seller?.city || undefined,
      province: seller?.province || undefined,
      country_code: seller?.country_code || undefined,
      postal_code: seller?.postal_code || undefined,
    },
    resolver: zodResolver(SellerAddressEditSchema),
  });

  const { mutateAsync, isPending } = useUpdateSeller(seller.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: () => {
        toast.success(
          t("sellers.edit.successToast", {
            name: seller.name ?? seller.email,
          }),
        );

        handleSuccess(`/sellers/${seller.id}`);
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
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="overflow-y-auto">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="address_1"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("sellers.fields.address_1")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      placeholder={t("sellers.fields.address_1")}
                      {...field}
                    />
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
                  <Form.Label optional>
                    {t("sellers.fields.address_2")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      placeholder={t("sellers.fields.address_2")}
                      {...field}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            <Form.Field
              control={form.control}
              name="city"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("sellers.fields.city")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      placeholder={t("sellers.fields.city")}
                      {...field}
                    />
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
                  <Form.Label optional>
                    {t("sellers.fields.province")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      placeholder={t("sellers.fields.province")}
                      {...field}
                    />
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
                  <Form.Label optional>
                    {t("sellers.fields.postal_code")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      placeholder={t("sellers.fields.postal_code")}
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
                  <Form.Label optional>
                    {t("sellers.fields.country_code")}
                  </Form.Label>
                  <Form.Control>
                    <Input
                      placeholder={t("sellers.fields.country_code")}
                      {...field}
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
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
