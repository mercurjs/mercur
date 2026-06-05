import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "@components/common/form";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { InferClientOutput } from "@mercurjs/client";
import { sdk } from "@lib/client";
import { useUpdateSellerProfessionalDetails } from "@hooks/api/sellers";

type Seller = InferClientOutput<typeof sdk.admin.sellers.$id.query>["seller"];

type StoreProfessionalDetailsFormProps = {
  seller: Seller;
};

const StoreProfessionalDetailsSchema = zod.object({
  corporate_name: zod.string().optional().or(zod.literal("")),
  registration_number: zod.string().optional().or(zod.literal("")),
  tax_id: zod.string().optional().or(zod.literal("")),
});

export const StoreProfessionalDetailsForm = ({
  seller,
}: StoreProfessionalDetailsFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const details = seller.professional_details;

  const form = useForm<zod.infer<typeof StoreProfessionalDetailsSchema>>({
    defaultValues: {
      corporate_name: details?.corporate_name ?? "",
      registration_number: details?.registration_number ?? "",
      tax_id: details?.tax_id ?? "",
    },
    resolver: zodResolver(StoreProfessionalDetailsSchema),
  });

  const { mutateAsync, isPending } = useUpdateSellerProfessionalDetails(
    seller.id,
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        corporate_name: values.corporate_name || null,
        registration_number: values.registration_number || null,
        tax_id: values.tax_id || null,
      },
      {
        onSuccess: () => {
          toast.success(
            t("store.professionalDetails.edit.successToast"),
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
            name="corporate_name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("store.professionalDetails.fields.corporateName")}
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
            name="registration_number"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("store.professionalDetails.fields.registrationNumber")}
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
            name="tax_id"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>
                  {t("store.professionalDetails.fields.taxId")}
                </Form.Label>
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
