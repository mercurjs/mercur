import { useState } from "react";

import { Button, Label, Select, Switch, toast } from "@medusajs/ui";

import type { ConfigurationRuleType } from "@custom-types/configuration";

import { useCreateConfigurationRule } from "@hooks/api/configuration";

type RuleType =
  | "global_product_catalog"
  | "require_product_approval"
  | "product_request_enabled"
  | "product_import_enabled";

type Props = {
  onSuccess?: () => void;
};

const CreateConfigurationRuleForm = ({ onSuccess }: Props) => {
  const [type, setType] = useState<RuleType>("global_product_catalog");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createRule } = useCreateConfigurationRule({});
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createRule({
        rule_type: type as ConfigurationRuleType,
        is_enabled: enabled,
      });
      onSuccess?.();
      setLoading(false);
    } catch (e: unknown) {
      toast.error((e as Error).message);
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} data-testid="configuration-create-rule-form">
      <fieldset className="my-4" data-testid="configuration-create-rule-form-rule-type-field">
        <legend className="mb-2" data-testid="configuration-create-rule-form-rule-type-legend">Rule type</legend>
        <Select
          value={type}
          onValueChange={(value) => {
            setType(value as RuleType);
          }}
          data-testid="configuration-create-rule-form-rule-type-select"
        >
          <Select.Trigger data-testid="configuration-create-rule-form-rule-type-trigger">
            <Select.Value placeholder="Type" />
          </Select.Trigger>
          <Select.Content data-testid="configuration-create-rule-form-rule-type-content">
            <Select.Item value="global_product_catalog" data-testid="configuration-create-rule-form-rule-type-option-global-product-catalog">
              global_product_catalog
            </Select.Item>
            <Select.Item value="require_product_approval" data-testid="configuration-create-rule-form-rule-type-option-require-product-approval">
              require_product_approval
            </Select.Item>
            <Select.Item value="product_request_enabled" data-testid="configuration-create-rule-form-rule-type-option-product-request-enabled">
              product_request_enabled
            </Select.Item>
            <Select.Item value="product_import_enabled" data-testid="configuration-create-rule-form-rule-type-option-product-import-enabled">
              product_import_enabled
            </Select.Item>
          </Select.Content>
        </Select>
      </fieldset>
      <fieldset className="my-4" data-testid="configuration-create-rule-form-enabled-field">
        <div className="flex items-center gap-x-2">
          <Switch
            id="is_enabled"
            onCheckedChange={(val) => {
              setEnabled(val);
            }}
            data-testid="configuration-create-rule-form-enabled-switch"
          />
          <Label data-testid="configuration-create-rule-form-enabled-label">Is rule enabled</Label>
        </div>
      </fieldset>
      <Button type="submit" isLoading={loading} data-testid="configuration-create-rule-form-create-button">
        Create
      </Button>
    </form>
  );
};

export default CreateConfigurationRuleForm;
