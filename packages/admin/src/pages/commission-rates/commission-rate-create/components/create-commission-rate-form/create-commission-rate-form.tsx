import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  CurrencyInput,
  Heading,
  Input,
  Select,
  Text,
  clx,
  toast,
  Switch,
} from "@medusajs/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "../../../../../components/common/form";
import { PercentageInput } from "../../../../../components/inputs/percentage-input";
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals";
import { KeyboundForm } from "../../../../../components/utilities/keybound-form";
import { useCreateCommissionRate } from "../../../../../hooks/api/commission-rates";
import { useStore } from "../../../../../hooks/api/store";
import { currencies as currencyData } from "../../../../../lib/data/currencies";
import { HttpTypes } from "@mercurjs/types";

const CreateCommissionRateSchema = zod.object({
  name: zod.string().min(1),
  code: zod.string().min(1),
  type: zod.enum(["fixed", "percentage"]),
  target: zod.enum(["item", "shipping"]),
  value: zod.coerce.number().min(0),
  currency_code: zod.string().optional(),
  min_amount: zod.coerce.number().optional(),
  include_tax: zod.boolean(),
  is_enabled: zod.boolean(),
  priority: zod.coerce.number().int().min(0),
});

export const CreateCommissionRateForm = ({
  store,
}: {
  store: HttpTypes.Store;
}) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof CreateCommissionRateSchema>>({
    defaultValues: {
      name: "",
      code: "",
      type: "percentage",
      target: "item",
      value: 0,
      currency_code: "",
      min_amount: undefined,
      include_tax: false,
      is_enabled: true,
      priority: 0,
    },
    resolver: zodResolver(CreateCommissionRateSchema),
  });

  const storeCurrencies = (store?.supported_currencies ?? []).map(
    (c) => currencyData[c.currency_code.toUpperCase()],
  );

  const defaultCurrencyCode =
    store?.supported_currencies?.[0]?.currency_code ?? "";

  useEffect(() => {
    if (defaultCurrencyCode && !form.getValues("currency_code")) {
      form.setValue("currency_code", defaultCurrencyCode);
    }
  }, [defaultCurrencyCode, form]);

  const { mutateAsync: createCommissionRate, isPending } =
    useCreateCommissionRate();

  const handleSubmit = form.handleSubmit(async (values) => {
    await createCommissionRate(
      {
        name: values.name,
        code: values.code,
        type: values.type,
        target: values.target,
        value: values.value,
        currency_code: values.currency_code || null,
        min_amount: values.min_amount ?? null,
        include_tax: values.include_tax,
        is_enabled: values.is_enabled,
        priority: values.priority,
      },
      {
        onSuccess: ({ commission_rate }) => {
          toast.success("Commission rate created successfully");
          handleSuccess(`../${commission_rate.id}`);
        },
        onError: (e) => {
          toast.error(e.message);
        },
      },
    );
  });

  const watchType = form.watch("type");
  const watchCurrency = form.watch("currency_code");

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        className="flex h-full flex-col overflow-hidden"
        onSubmit={handleSubmit}
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex overflow-hidden">
          <div
            className={clx(
              "flex h-full w-full flex-col items-center overflow-y-auto p-16",
            )}
          >
            <div className="flex w-full max-w-[720px] flex-col gap-y-8">
              <div>
                <Heading>Create Commission Rate</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Configure a new commission rate for your marketplace.
                </Text>
              </div>
              <div className="flex flex-col gap-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Name</Form.Label>
                        <Form.Control>
                          <Input {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Code</Form.Label>
                        <Form.Control>
                          <Input {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="type"
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Type</Form.Label>
                        <Form.Control>
                          <Select {...field} onValueChange={onChange}>
                            <Select.Trigger ref={ref}>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              <Select.Item value="percentage">
                                Percentage
                              </Select.Item>
                              <Select.Item value="fixed">Fixed</Select.Item>
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="target"
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Target</Form.Label>
                        <Form.Control>
                          <Select {...field} onValueChange={onChange}>
                            <Select.Trigger ref={ref}>
                              <Select.Value />
                            </Select.Trigger>
                            <Select.Content>
                              <Select.Item value="item">Item</Select.Item>
                              <Select.Item value="shipping">
                                Shipping
                              </Select.Item>
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="value"
                    render={({ field: { value, onChange, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Rate</Form.Label>
                        <Form.Control>
                          {watchType === "percentage" ? (
                            <PercentageInput
                              {...field}
                              value={value}
                              onValueChange={(_value, _name, values) =>
                                onChange(values?.float ?? 0)
                              }
                            />
                          ) : (
                            <CurrencyInput
                              {...field}
                              min={0}
                              code={watchCurrency || defaultCurrencyCode}
                              onValueChange={(_value, _name, values) =>
                                onChange(values?.float ?? 0)
                              }
                            />
                          )}
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Priority</Form.Label>
                        <Form.Control>
                          <Input type="number" {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Field
                    control={form.control}
                    name="currency_code"
                    render={({ field: { onChange, ref, ...field } }) => (
                      <Form.Item>
                        <Form.Label>Currency Code</Form.Label>
                        <Form.Control>
                          <Select {...field} onValueChange={onChange}>
                            <Select.Trigger ref={ref}>
                              <Select.Value placeholder="Select currency" />
                            </Select.Trigger>
                            <Select.Content>
                              {storeCurrencies.map((currency) => (
                                <Select.Item
                                  value={currency.code.toLowerCase()}
                                  key={currency.code}
                                >
                                  {currency.name}
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                  <Form.Field
                    control={form.control}
                    name="min_amount"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>Minimum Amount</Form.Label>
                        <Form.Control>
                          <Input type="number" {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )}
                  />
                </div>
              </div>
              <Form.Field
                control={form.control}
                name="is_enabled"
                render={({ field: { value, onChange, ...field } }) => (
                  <Form.Item>
                    <div className="flex items-start justify-between">
                      <Form.Label>Enabled</Form.Label>
                      <Form.Control>
                        <Switch
                          {...field}
                          checked={value}
                          onCheckedChange={onChange}
                        />
                      </Form.Control>
                    </div>
                    <Form.Hint>
                      Enable or disable this commission rate.
                    </Form.Hint>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="include_tax"
                render={({ field: { value, onChange, ...field } }) => (
                  <Form.Item>
                    <div className="flex items-start justify-between">
                      <Form.Label>Include Tax</Form.Label>
                      <Form.Control>
                        <Switch
                          {...field}
                          checked={value}
                          onCheckedChange={onChange}
                        />
                      </Form.Control>
                    </div>
                    <Form.Hint>
                      Include tax in the commission calculation.
                    </Form.Hint>
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
          <Button size="small" type="submit" isLoading={isPending}>
            {t("actions.save")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
