import { zodResolver } from "@hookform/resolvers/zod";
import i18n from "i18next";
import { Button, DatePicker, Textarea, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Form } from "@components/common/form";
import { RouteDrawer, useRouteModal } from "@components/modals";
import { KeyboundForm } from "@components/utilities/keybound-form";
import { HttpTypes } from "@mercurjs/types";
import { useUpdateSeller } from "@hooks/api";

type StoreClosureFormProps = {
  seller: HttpTypes.StoreSellerResponse["seller"];
};

const firstDayRequiredMessage = () =>
  i18n.t("store.timeOff.validation.firstDayRequired");

const StoreClosureSchema = z.object({
  closed_from: z.date({
    required_error: firstDayRequiredMessage(),
    invalid_type_error: firstDayRequiredMessage(),
  }),
  closed_to: z.date().nullable(),
  closure_note: z.string().nullable(),
});

export const StoreClosureForm = ({ seller }: StoreClosureFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<z.infer<typeof StoreClosureSchema>>({
    defaultValues: {
      closed_from: seller.closed_from
        ? new Date(seller.closed_from)
        : null,
      closed_to: seller.closed_to ? new Date(seller.closed_to) : null,
      closure_note: seller.closure_note ?? "",
    },
    resolver: zodResolver(StoreClosureSchema),
  });

  const { mutateAsync, isPending } = useUpdateSeller(seller.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        closed_from: data.closed_from || null,
        closed_to: data.closed_to || null,
        closure_note: data.closure_note || null,
      },
      {
        onSuccess: () => {
          toast.success(t("store.timeOff.create.successToast"));
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
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="closed_from"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>
                      {t("store.timeOff.fields.firstDay")}
                    </Form.Label>
                    <Form.Control>
                      <DatePicker
                        granularity="minute"
                        shouldCloseOnSelect={false}
                        {...field}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="closed_to"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.timeOff.fields.lastDay")}
                    </Form.Label>
                    <Form.Control>
                      <DatePicker
                        granularity="minute"
                        shouldCloseOnSelect={false}
                        {...field}
                      />
                    </Form.Control>
                    <Form.Hint>
                      {t("store.timeOff.fields.lastDayHint")}
                    </Form.Hint>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="closure_note"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t("store.timeOff.fields.note")}
                    </Form.Label>
                    <Form.Control>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
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
