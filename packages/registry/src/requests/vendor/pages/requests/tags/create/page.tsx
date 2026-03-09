import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, Text, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import {
  Form,
  RouteFocusModal,
  useRouteModal,
} from "@mercurjs/dashboard-shared";
import { useCreateVendorRequest } from "../../../../hooks/api/requests";

const CreateTagRequestSchema = zod.object({
  value: zod.string().min(1),
});

const TagRequestCreatePage = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof CreateTagRequestSchema>>({
    defaultValues: {
      value: "",
    },
    resolver: zodResolver(CreateTagRequestSchema),
  });

  const { mutateAsync, isPending } = useCreateVendorRequest("product_tag");

  const handleSubmit = form.handleSubmit(async (data) => {
    await mutateAsync(data, {
      onSuccess: () => {
        toast.success("Tag request created successfully");
        handleSuccess(`/requests/tags`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  });

  return (
    <RouteFocusModal>
      <RouteFocusModal.Form form={form}>
        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col overflow-hidden"
        >
          <RouteFocusModal.Header />
          <RouteFocusModal.Body className="flex size-full flex-col items-center p-16">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8">
              <div>
                <Heading>Request Tag</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Submit a request to create a new product tag.
                </Text>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>
                        {t("productTags.fields.value")}
                      </Form.Label>
                      <Form.Control>
                        <Input autoComplete="off" {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
            </div>
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer>
            <RouteFocusModal.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              size="small"
              variant="primary"
              type="submit"
              isLoading={isPending}
            >
              {t("actions.create")}
            </Button>
          </RouteFocusModal.Footer>
        </form>
      </RouteFocusModal.Form>
    </RouteFocusModal>
  );
};

export default TagRequestCreatePage;
