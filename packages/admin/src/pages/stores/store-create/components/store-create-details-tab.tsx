import { Heading, Input, Select } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Form } from "../../../../components/common/form";
import { HandleInput } from "../../../../components/inputs/handle-input";
import { useTabbedForm } from "../../../../components/tabbed-form/tabbed-form";
import { defineTabMeta } from "../../../../components/tabbed-form/types";
import { useStore } from "../../../../hooks/api";
import { CreateStoreSchemaType } from "./schema";

const Root = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<CreateStoreSchemaType>();
  const { store } = useStore();

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-3">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-y-8 px-px py-16">
        <div>
          <Heading>{t("stores.create.header")}</Heading>
        </div>
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.name")}</Form.Label>
                <Form.Control>
                  <Input {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="handle"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional tooltip={t("stores.handleTooltip")}>
                  {t("fields.handle")}
                </Form.Label>
                <Form.Control>
                  <HandleInput {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="email"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.email")}</Form.Label>
                <Form.Control>
                  <Input type="email" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="phone"
            render={({ field }) => (
              <Form.Item>
                <Form.Label optional>{t("fields.phone")}</Form.Label>
                <Form.Control>
                  <Input type="tel" {...field} />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="currency_code"
            render={({ field: { onChange, ref, ...field } }) => (
              <Form.Item>
                <Form.Label>{t("fields.currency")}</Form.Label>
                <Form.Control>
                  <Select {...field} onValueChange={onChange}>
                    <Select.Trigger ref={ref}>
                      <Select.Value placeholder={t("fields.selectPlaceholder", "Select")} />
                    </Select.Trigger>
                    <Select.Content>
                      {store?.supported_currencies?.map((sc) => (
                        <Select.Item
                          key={sc.currency_code}
                          value={sc.currency_code}
                        >
                          {sc.currency_code.toUpperCase()}
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
      </div>
    </div>
  );
};

Root._tabMeta = defineTabMeta<CreateStoreSchemaType>({
  id: "details",
  labelKey: "stores.create.tabs.details",
  validationFields: ["name", "email", "phone", "currency_code"],
});

export const StoreCreateDetailsTab = Root;
