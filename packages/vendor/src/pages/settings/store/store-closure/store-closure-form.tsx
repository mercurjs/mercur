import { zodResolver } from "@hookform/resolvers/zod";
import { Button, DatePicker, toast } from "@medusajs/ui";
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

const StoreClosureSchema = z
  .object({
    closed_from: z.date({ required_error: "Close from date is required" }),
    closed_to: z.date().nullable(),
  })
  .refine((data) => data.closed_from >= new Date(new Date().toDateString()), {
    message: "Close from date cannot be in the past",
    path: ["closed_from"],
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
    },
    resolver: zodResolver(StoreClosureSchema),
  });

  const { mutateAsync, isPending } = useUpdateSeller(seller.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(
      {
        closed_from: data.closed_from || null,
        closed_to: data.closed_to || null,
      },
      {
        onSuccess: () => {
          toast.success(
            t("store.scheduledClosure.edit.successToast"),
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
                      {t("store.scheduledClosure.fields.closedFrom")}
                    </Form.Label>
                    <Form.Control>
                      <DatePicker
                        granularity="minute"
                        hourCycle={12}
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
                      {t("store.scheduledClosure.fields.closedTo")}
                    </Form.Label>
                    <Form.Hint>
                      {t("store.scheduledClosure.fields.closedToHint")}
                    </Form.Hint>
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
