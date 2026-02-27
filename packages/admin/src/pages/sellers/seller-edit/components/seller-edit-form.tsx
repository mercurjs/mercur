import { Button, Heading, Input, toast } from "@medusajs/ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Form } from "@components/common/form";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";

import { useUpdateSeller } from "@hooks/api/sellers";
import { HttpTypes } from "@mercurjs/types";

type SellerEditFormProps = {
  seller: HttpTypes.AdminSellerResponse["seller"];
};

const SellerEditSchema = z.object({
  name: z.string().optional(),
  handle: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  logo: z.string().optional(),
  cover_image: z.string().optional(),
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country_code: z.string().optional(),
  postal_code: z.string().optional(),
});

export const SellerEditForm = ({ seller }: SellerEditFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<z.infer<typeof SellerEditSchema>>({
    defaultValues: {
      name: seller?.name,
      handle: seller?.handle || undefined,
      email: seller?.email || "",
      phone: seller?.phone || undefined,
      logo: seller?.logo || undefined,
      cover_image: seller?.cover_image || undefined,
      address_1: seller?.address_1 || undefined,
      address_2: seller?.address_2 || undefined,
      city: seller?.city || undefined,
      province: seller?.province || undefined,
      country_code: seller?.country_code || undefined,
      postal_code: seller?.postal_code || undefined,
    },
    resolver: zodResolver(SellerEditSchema),
  });

  const { mutateAsync, isPending } = useUpdateSeller(seller.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      data,
      {
        onSuccess: () => {
          toast.success(
            t("sellers.edit.successToast", { name: data.name ?? data.email }),
          );

          handleSuccess(`/sellers/${seller.id}`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  return (
    <RouteDrawer.Form form={form} data-testid="seller-edit-form">
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
        data-testid="seller-edit-form-keybound"
      >
        <RouteDrawer.Body
          className="overflow-y-auto"
          data-testid="seller-edit-form-body"
        >
          <div
            className="flex flex-col gap-y-4"
            data-testid="seller-edit-form-fields"
          >
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="seller-edit-form-name-item">
                    <Form.Label data-testid="seller-edit-form-name-label">
                      {t("sellers.fields.name")}
                    </Form.Label>

                    <Form.Control data-testid="seller-edit-form-name-control">
                      <Input
                        placeholder={t("sellers.fields.name")}
                        {...field}
                        data-testid="seller-edit-form-name-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="seller-edit-form-name-error" />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="seller-edit-form-email-item">
                    <Form.Label data-testid="seller-edit-form-email-label">
                      {t("sellers.fields.email")}
                    </Form.Label>

                    <Form.Control data-testid="seller-edit-form-email-control">
                      <Input
                        placeholder={t("sellers.fields.email")}
                        {...field}
                        data-testid="seller-edit-form-email-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="seller-edit-form-email-error" />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="handle"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="seller-edit-form-handle-item">
                    <Form.Label
                      optional
                      data-testid="seller-edit-form-handle-label"
                    >
                      {t("sellers.fields.handle")}
                    </Form.Label>

                    <Form.Control data-testid="seller-edit-form-handle-control">
                      <Input
                        placeholder={t("sellers.fields.handle")}
                        {...field}
                        data-testid="seller-edit-form-handle-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="seller-edit-form-handle-error" />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="phone"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="seller-edit-form-phone-item">
                    <Form.Label
                      optional
                      data-testid="seller-edit-form-phone-label"
                    >
                      {t("sellers.fields.phone")}
                    </Form.Label>

                    <Form.Control data-testid="seller-edit-form-phone-control">
                      <Input
                        placeholder={t("sellers.fields.phone")}
                        {...field}
                        data-testid="seller-edit-form-phone-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="seller-edit-form-phone-error" />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="logo"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="seller-edit-form-logo-item">
                    <Form.Label
                      optional
                      data-testid="seller-edit-form-logo-label"
                    >
                      {t("sellers.fields.logo")}
                    </Form.Label>

                    <Form.Control data-testid="seller-edit-form-logo-control">
                      <Input
                        placeholder={t("sellers.fields.logo")}
                        {...field}
                        data-testid="seller-edit-form-logo-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="seller-edit-form-logo-error" />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="cover_image"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="seller-edit-form-cover-image-item">
                    <Form.Label
                      optional
                      data-testid="seller-edit-form-cover-image-label"
                    >
                      {t("sellers.fields.cover_image")}
                    </Form.Label>

                    <Form.Control data-testid="seller-edit-form-cover-image-control">
                      <Input
                        placeholder={t("sellers.fields.cover_image")}
                        {...field}
                        data-testid="seller-edit-form-cover-image-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="seller-edit-form-cover-image-error" />
                  </Form.Item>
                );
              }}
            />

            <div
              className="mt-4"
              data-testid="seller-edit-form-address-section"
            >
              <Heading
                level="h3"
                className="mb-4"
                data-testid="seller-edit-form-address-heading"
              >
                {t("sellers.fields.address")}
              </Heading>

              <div
                className="flex flex-col gap-y-4"
                data-testid="seller-edit-form-address-fields"
              >
                <Form.Field
                  control={form.control}
                  name="address_1"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="seller-edit-form-address-1-item">
                        <Form.Label
                          optional
                          data-testid="seller-edit-form-address-1-label"
                        >
                          {t("sellers.fields.address_1")}
                        </Form.Label>

                        <Form.Control data-testid="seller-edit-form-address-1-control">
                          <Input
                            placeholder={t("sellers.fields.address_1")}
                            {...field}
                            data-testid="seller-edit-form-address-1-input"
                          />
                        </Form.Control>

                        <Form.ErrorMessage data-testid="seller-edit-form-address-1-error" />
                      </Form.Item>
                    );
                  }}
                />

                <Form.Field
                  control={form.control}
                  name="address_2"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="seller-edit-form-address-2-item">
                        <Form.Label
                          optional
                          data-testid="seller-edit-form-address-2-label"
                        >
                          {t("sellers.fields.address_2")}
                        </Form.Label>

                        <Form.Control data-testid="seller-edit-form-address-2-control">
                          <Input
                            placeholder={t("sellers.fields.address_2")}
                            {...field}
                            data-testid="seller-edit-form-address-2-input"
                          />
                        </Form.Control>

                        <Form.ErrorMessage data-testid="seller-edit-form-address-2-error" />
                      </Form.Item>
                    );
                  }}
                />

                <Form.Field
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="seller-edit-form-postal-code-item">
                        <Form.Label
                          optional
                          data-testid="seller-edit-form-postal-code-label"
                        >
                          {t("sellers.fields.postal_code")}
                        </Form.Label>

                        <Form.Control data-testid="seller-edit-form-postal-code-control">
                          <Input
                            placeholder={t("sellers.fields.postal_code")}
                            {...field}
                            data-testid="seller-edit-form-postal-code-input"
                          />
                        </Form.Control>

                        <Form.ErrorMessage data-testid="seller-edit-form-postal-code-error" />
                      </Form.Item>
                    );
                  }}
                />

                <Form.Field
                  control={form.control}
                  name="city"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="seller-edit-form-city-item">
                        <Form.Label
                          optional
                          data-testid="seller-edit-form-city-label"
                        >
                          {t("sellers.fields.city")}
                        </Form.Label>

                        <Form.Control data-testid="seller-edit-form-city-control">
                          <Input
                            placeholder={t("sellers.fields.city")}
                            {...field}
                            data-testid="seller-edit-form-city-input"
                          />
                        </Form.Control>

                        <Form.ErrorMessage data-testid="seller-edit-form-city-error" />
                      </Form.Item>
                    );
                  }}
                />

                <Form.Field
                  control={form.control}
                  name="province"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="seller-edit-form-province-item">
                        <Form.Label
                          optional
                          data-testid="seller-edit-form-province-label"
                        >
                          {t("sellers.fields.province")}
                        </Form.Label>

                        <Form.Control data-testid="seller-edit-form-province-control">
                          <Input
                            placeholder={t("sellers.fields.province")}
                            {...field}
                            data-testid="seller-edit-form-province-input"
                          />
                        </Form.Control>

                        <Form.ErrorMessage data-testid="seller-edit-form-province-error" />
                      </Form.Item>
                    );
                  }}
                />

                <Form.Field
                  control={form.control}
                  name="country_code"
                  render={({ field }) => {
                    return (
                      <Form.Item data-testid="seller-edit-form-country-code-item">
                        <Form.Label
                          optional
                          data-testid="seller-edit-form-country-code-label"
                        >
                          {t("sellers.fields.country_code")}
                        </Form.Label>

                        <Form.Control data-testid="seller-edit-form-country-code-control">
                          <Input
                            placeholder={t("sellers.fields.country_code")}
                            {...field}
                            data-testid="seller-edit-form-country-code-input"
                          />
                        </Form.Control>

                        <Form.ErrorMessage data-testid="seller-edit-form-country-code-error" />
                      </Form.Item>
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="seller-edit-form-footer">
          <div
            className="flex items-center justify-end gap-x-2"
            data-testid="seller-edit-form-footer-actions"
          >
            <RouteDrawer.Close asChild>
              <Button
                variant="secondary"
                size="small"
                data-testid="seller-edit-form-cancel-button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>

            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              data-testid="seller-edit-form-submit-button"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
