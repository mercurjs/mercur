import { useState } from "react";
import { Input, Button, toast, Switch, Label } from "@medusajs/ui";
import { useUpsertDefaultCommisionRule } from "../../../../hooks/api/commission";
import { AdminCommissionAggregate } from "@mercurjs/http-client";

type Props = {
  onSuccess?: () => void;
  rule?: AdminCommissionAggregate;
};

const UpsertDefaultCommissionRuleForm = ({ onSuccess, rule }: Props) => {
  const defaultRateValue =
    rule?.type === "flat"
      ? Number(rule.price_amount)
      : Number(rule?.percentage_rate);
  const [rateType, setRateType] = useState(rule?.type || "flat");
  const [rateValue, setRateValue] = useState(defaultRateValue || 0);
  const [includeTax, setIncludeTax] = useState(rule?.include_tax || false);
  const [minCommission, setMinCommission] = useState<number | null>(
    Number(rule?.min_price_amount) || null,
  );
  const [maxCommission, setMaxCommission] = useState<number | null>(
    Number(rule?.max_price_amount) || null,
  );
  const [loading, setLoading] = useState(false);

  const { mutateAsync: upsertCommissionRule } = useUpsertDefaultCommisionRule(
    {},
  );

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rule_payload = {
        is_active: true,
        rate: {
          type: rateType as "flat" | "percentage",
          percentage_rate: rateType === "percentage" ? rateValue : undefined,
          include_tax: includeTax,
          price_set: rateType === "flat" ? { amount: rateValue } : undefined,
          min_price_set: minCommission ? { amount: minCommission } : undefined,
          max_price_set: maxCommission ? { amount: maxCommission } : undefined,
        },
      };

      await upsertCommissionRule(rule_payload);
      setLoading(false);
      toast.success("Created!");
      onSuccess?.();
    } catch (e: any) {
      toast.error("Error!");
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <fieldset className="my-4">
        <div className="flex items-center gap-x-2">
          <Switch
            id="include_tax"
            checked={includeTax}
            onCheckedChange={(val) => {
              setIncludeTax(val);
            }}
          />
          <Label>Commission charged including tax</Label>
        </div>
      </fieldset>
      <fieldset className="my-4">
        <legend className="mb-2">Fee type</legend>
        <div className="flex items-center gap-x-2">
          <Label>Flat fee</Label>
          <Switch
            id="rate_type"
            checked={rateType === "percentage"}
            onCheckedChange={(val) => {
              setRateType(val ? "percentage" : "flat");
            }}
          />
          <Label>Percentage</Label>
        </div>
      </fieldset>
      <fieldset className="my-4">
        <legend className="mb-2">
          Fee ({rateType === "flat" ? "USD" : "%"})
        </legend>
        <Input
          name="rate_value"
          type="number"
          value={rateValue}
          onChange={(e) => setRateValue(parseFloat(e.target.value))}
        />
      </fieldset>
      {rateType === "percentage" && (
        <>
          <fieldset className="my-4">
            <div className="flex items-center gap-x-2">
              <Label>Minimum commission value (USD)</Label>
              <Switch
                id="min_com"
                checked={minCommission !== null}
                onCheckedChange={(val) => {
                  setMinCommission(val ? 0 : null);
                }}
              />
            </div>
            {minCommission !== null && (
              <Input
                name="min_com_val"
                type="number"
                value={minCommission || 0}
                onChange={(e) => setMinCommission(parseFloat(e.target.value))}
              />
            )}
          </fieldset>
          <fieldset className="my-4">
            <div className="flex items-center gap-x-2">
              <Label>Maximum commission value (USD)</Label>
              <Switch
                id="max_com"
                checked={maxCommission !== null}
                onCheckedChange={(val) => {
                  setMaxCommission(val ? 0 : null);
                }}
              />
            </div>
            {maxCommission !== null && (
              <Input
                name="max_com_val"
                type="number"
                value={maxCommission || 0}
                onChange={(e) => setMaxCommission(parseFloat(e.target.value))}
              />
            )}
          </fieldset>
        </>
      )}
      <Button type="submit" isLoading={loading}>
        Create
      </Button>
    </form>
  );
};

export default UpsertDefaultCommissionRuleForm;
