import { useEffect, useState } from "react";

import { Button, Input, Label, Switch, toast } from "@medusajs/ui";

import type { AdminCommissionAggregate } from "@custom-types/commission";

import { useStores, useUpsertDefaultCommisionRule } from "@hooks/api";

type Props = {
  onSuccess?: () => void;
  rule?: AdminCommissionAggregate;
};

type Price = { amount: number; currency_code: string };

const UpsertDefaultCommissionRuleForm = ({ onSuccess, rule }: Props) => {
  const [rateType, setRateType] = useState(rule?.type || "flat");
  const [ratePercentValue, setRatePercentValue] = useState(
    Number(rule?.percentage_rate) || 0,
  );
  const [rateFlatValue, setRateFlatValue] = useState<Price[]>(
    rule?.price_set || [],
  );
  const [includeTax, setIncludeTax] = useState(rule?.include_tax || false);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [minCommissionEnabled, setMinCommissionEnabled] = useState<boolean>(
    !!rule?.min_price_set,
  );
  const [maxCommissionEnabled, setMaxCommissionEnabled] = useState<boolean>(
    !!rule?.max_price_set,
  );
  const [minCommission, setMinCommission] = useState<Price[]>(
    rule?.min_price_set || [],
  );
  const [maxCommission, setMaxCommission] = useState<Price[]>(
    rule?.max_price_set || [],
  );
  const [loading, setLoading] = useState(false);

  const { mutateAsync: upsertCommissionRule } = useUpsertDefaultCommisionRule(
    {},
  );

  const { stores } = useStores();

  useEffect(() => {
    if (stores && stores[0]) {
      setCurrencies(stores[0].supported_currencies.map((c) => c.currency_code));
    }
  }, [stores]);

  useEffect(() => {
    setRateFlatValue(
      currencies.map((currency_code) => ({ currency_code, amount: 0 })),
    );
  }, [currencies]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rule_payload = {
        is_active: true,
        name: "Default commission rule",
        rate: {
          type: rateType as "flat" | "percentage",
          percentage_rate:
            rateType === "percentage" ? ratePercentValue : undefined,
          include_tax: includeTax,
          price_set: rateType === "flat" ? rateFlatValue : undefined,
          min_price_set: minCommissionEnabled ? minCommission : undefined,
          max_price_set: maxCommissionEnabled ? maxCommission : undefined,
        },
      };

      await upsertCommissionRule(rule_payload);
      setLoading(false);
      toast.success("Created!");
      onSuccess?.();
    } catch (e: unknown) {
      toast.error("Error!");
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} data-testid="commission-upsert-default-rule-form">
      <fieldset className="my-4" data-testid="commission-upsert-default-rule-form-include-tax-fieldset">
        <div className="flex items-center gap-x-2" data-testid="commission-upsert-default-rule-form-include-tax-container">
          <Switch
            id="include_tax"
            checked={includeTax}
            onCheckedChange={(val) => {
              setIncludeTax(val);
            }}
            data-testid="commission-upsert-default-rule-form-include-tax-switch"
          />
          <Label data-testid="commission-upsert-default-rule-form-include-tax-label">Commission charged including tax</Label>
        </div>
      </fieldset>
      <fieldset className="my-4" data-testid="commission-upsert-default-rule-form-rate-type-fieldset">
        <legend className="mb-2" data-testid="commission-upsert-default-rule-form-rate-type-legend">Fee type</legend>
        <div className="flex items-center gap-x-2" data-testid="commission-upsert-default-rule-form-rate-type-container">
          <Label data-testid="commission-upsert-default-rule-form-rate-type-flat-label">Flat fee</Label>
          <Switch
            id="rate_type"
            checked={rateType === "percentage"}
            onCheckedChange={(val) => {
              setRateType(val ? "percentage" : "flat");
            }}
            data-testid="commission-upsert-default-rule-form-rate-type-switch"
          />
          <Label data-testid="commission-upsert-default-rule-form-rate-type-percentage-label">Percentage</Label>
        </div>
      </fieldset>
      <fieldset className="my-4" data-testid="commission-upsert-default-rule-form-rate-value-fieldset">
        <legend className="mb-2" data-testid="commission-upsert-default-rule-form-rate-value-legend">Fee value</legend>
        {rateType === "percentage" && (
          <Input
            name="rate_percent_value"
            type="number"
            value={ratePercentValue}
            onChange={(e) => setRatePercentValue(parseFloat(e.target.value))}
            data-testid="commission-upsert-default-rule-form-rate-percent-value-input"
          />
        )}
        {rateType === "flat" &&
          currencies &&
          currencies.map((currency) => {
            return (
              <div key={currency} data-testid={`commission-upsert-default-rule-form-rate-flat-value-${currency}`}>
                <Label data-testid={`commission-upsert-default-rule-form-rate-flat-value-${currency}-label`}>{currency.toUpperCase()}</Label>
                <Input
                  name={"rate_flat_val" + { currency }}
                  type="number"
                  value={
                    rateFlatValue.filter((v) => v.currency_code === currency)[0]
                      ?.amount || 0
                  }
                  onChange={(e) =>
                    setRateFlatValue((prevValue) => {
                      return [
                        ...prevValue.filter(
                          (v) => v.currency_code !== currency,
                        ),
                        {
                          currency_code: currency,
                          amount: parseFloat(e.target.value),
                        },
                      ];
                    })
                  }
                  data-testid={`commission-upsert-default-rule-form-rate-flat-value-${currency}-input`}
                />
              </div>
            );
          })}
      </fieldset>
      {rateType === "percentage" && (
        <>
          <fieldset className="my-4" data-testid="commission-upsert-default-rule-form-min-commission-fieldset">
            <div className="flex items-center gap-x-2" data-testid="commission-upsert-default-rule-form-min-commission-container">
              <Label data-testid="commission-upsert-default-rule-form-min-commission-label">Minimum commission value</Label>
              <Switch
                id="min_com"
                checked={minCommissionEnabled}
                onCheckedChange={(val) => {
                  setMinCommissionEnabled(val);
                }}
                data-testid="commission-upsert-default-rule-form-min-commission-switch"
              />
            </div>
            {minCommissionEnabled &&
              currencies &&
              currencies.map((currency) => {
                return (
                  <div key={currency} data-testid={`commission-upsert-default-rule-form-min-commission-${currency}`}>
                    <Label data-testid={`commission-upsert-default-rule-form-min-commission-${currency}-label`}>{currency.toUpperCase()}</Label>
                    <Input
                      name={"min_com_val" + { currency }}
                      type="number"
                      value={
                        minCommission.filter(
                          (v) => v.currency_code === currency,
                        )[0]?.amount || 0
                      }
                      onChange={(e) =>
                        setMinCommission((prevValue) => {
                          return [
                            ...prevValue.filter(
                              (v) => v.currency_code !== currency,
                            ),
                            {
                              currency_code: currency,
                              amount: parseFloat(e.target.value),
                            },
                          ];
                        })
                      }
                      data-testid={`commission-upsert-default-rule-form-min-commission-${currency}-input`}
                    />
                  </div>
                );
              })}
          </fieldset>
          <fieldset className="my-4" data-testid="commission-upsert-default-rule-form-max-commission-fieldset">
            <div className="flex items-center gap-x-2" data-testid="commission-upsert-default-rule-form-max-commission-container">
              <Label data-testid="commission-upsert-default-rule-form-max-commission-label">Maximum commission value</Label>
              <Switch
                id="max_com"
                checked={maxCommissionEnabled}
                onCheckedChange={(val) => {
                  setMaxCommissionEnabled(val);
                }}
                data-testid="commission-upsert-default-rule-form-max-commission-switch"
              />
            </div>
            {maxCommissionEnabled &&
              currencies &&
              currencies.map((currency) => {
                return (
                  <div key={currency} data-testid={`commission-upsert-default-rule-form-max-commission-${currency}`}>
                    <Label data-testid={`commission-upsert-default-rule-form-max-commission-${currency}-label`}>{currency.toUpperCase()}</Label>
                    <Input
                      name={"max_com_val" + { currency }}
                      type="number"
                      value={
                        maxCommission.filter(
                          (v) => v.currency_code === currency,
                        )[0]?.amount || 0
                      }
                      onChange={(e) =>
                        setMaxCommission((prevValue) => {
                          return [
                            ...prevValue.filter(
                              (v) => v.currency_code !== currency,
                            ),
                            {
                              currency_code: currency,
                              amount: parseFloat(e.target.value),
                            },
                          ];
                        })
                      }
                      data-testid={`commission-upsert-default-rule-form-max-commission-${currency}-input`}
                    />
                  </div>
                );
              })}
          </fieldset>
        </>
      )}
      <Button type="submit" isLoading={loading} data-testid="commission-upsert-default-rule-form-submit-button">
        Create
      </Button>
    </form>
  );
};

export default UpsertDefaultCommissionRuleForm;
