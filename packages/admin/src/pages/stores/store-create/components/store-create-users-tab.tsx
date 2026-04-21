import { Heading, Input, Text } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Form } from "../../../../components/common/form";
import { useTabbedForm } from "../../../../components/tabbed-form/tabbed-form";
import { defineTabMeta } from "../../../../components/tabbed-form/types";
import { CreateStoreSchemaType } from "./schema";

const Root = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<CreateStoreSchemaType>();

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-3">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-px py-16">
        <div>
          <Heading>{t("stores.create.usersHeader")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("stores.create.usersHint")}
          </Text>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {t("stores.create.usersHintSecondary")}
          </Text>
        </div>
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="member_email"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.email")}</Form.Label>
                <Form.Control>
                  <Input
                    type="email"
                    {...field}
                    placeholder="admin@example.com"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
};

Root._tabMeta = defineTabMeta<CreateStoreSchemaType>({
  id: "users",
  labelKey: "stores.create.tabs.users",
});

export const StoreCreateUsersTab = Root;
