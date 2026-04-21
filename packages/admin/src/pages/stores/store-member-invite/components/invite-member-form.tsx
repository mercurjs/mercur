import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Heading,
  Input,
  Select,
  Text,
  toast,
} from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import * as zod from "zod";

import { Form } from "../../../../components/common/form";
import { RouteFocusModal } from "../../../../components/modals";
import { KeyboundForm } from "../../../../components/utilities/keybound-form";
import { useInviteSellerMember } from "../../../../hooks/api/sellers";
import { SellerRole } from "@mercurjs/types";

const ROLE_OPTIONS = [
  {
    value: SellerRole.SELLER_ADMINISTRATION,
    labelKey: "users.roles.administration",
  },
  {
    value: SellerRole.INVENTORY_MANAGEMENT,
    labelKey: "users.roles.inventoryManagement",
  },
  {
    value: SellerRole.ORDER_MANAGEMENT,
    labelKey: "users.roles.orderManagement",
  },
  { value: SellerRole.ACCOUNTING, labelKey: "users.roles.accounting" },
  { value: SellerRole.SUPPORT, labelKey: "users.roles.support" },
];

const InviteMemberSchema = zod.object({
  email: zod.string().email(),
  role_id: zod.string().min(1),
});

export const InviteMemberForm = () => {
  const { t } = useTranslation();
  const { id } = useParams();

  const form = useForm<zod.infer<typeof InviteMemberSchema>>({
    defaultValues: {
      email: "",
      role_id: "",
    },
    resolver: zodResolver(InviteMemberSchema),
  });

  const { mutateAsync, isPending } = useInviteSellerMember(id!);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await mutateAsync({
        email: values.email,
        role_id: values.role_id as SellerRole,
      });
      toast.success(t("users.inviteSuccess", "Invite sent successfully"));
      form.reset();
    } catch (error) {
      toast.error((error as Error).message);
    }
  });

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col items-center overflow-y-auto">
            <div className="flex w-full max-w-[720px] flex-col gap-y-8 px-2 py-16">
              <div>
                <Heading>{t("users.inviteUser", "Invite User")}</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  {t(
                    "users.inviteUserHint",
                    "Invite a new user to this store.",
                  )}
                </Text>
              </div>

              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Form.Field
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>{t("fields.email")}</Form.Label>
                        <Form.Control>
                          <Input {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="role_id"
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Form.Item>
                        <Form.Label>{t("fields.role")}</Form.Label>
                        <Form.Control>
                          <Select {...field} onValueChange={onChange}>
                            <Select.Trigger ref={ref}>
                              <Select.Value
                                placeholder={t(
                                  "users.selectRole",
                                  "Select a role",
                                )}
                              />
                            </Select.Trigger>
                            <Select.Content>
                              {ROLE_OPTIONS.map((role) => (
                                <Select.Item
                                  key={role.value}
                                  value={role.value}
                                >
                                  {t(role.labelKey)}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    size="small"
                    variant="secondary"
                    type="submit"
                    isLoading={isPending}
                  >
                    {t("users.sendInvite", "Send invite")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
