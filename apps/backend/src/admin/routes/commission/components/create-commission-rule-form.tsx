import { useEffect, useState } from "react";
import { Input, Button, Select, toast, Switch, Label } from "@medusajs/ui";

import { useSellers } from "../../../hooks/api/seller";
import { useCreateCommisionRule } from "../../../hooks/api/commission";
import { useStores } from "../../../hooks/api/stores";
import { useProductTypes } from "../../../hooks/api/product_type";
import { useProductCategories } from "../../../hooks/api/product_category";

type Props = {
  onSuccess?: () => void;
};

type Price = { amount: number, currency_code: string}

const CreateCommissionRuleForm = ({ onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [reference, setReference] = useState("seller");
  const [rateType, setRateType] = useState("flat");
  const [ratePercentValue, setRatePercentValue] = useState(0);
  const [rateFlatValue, setRateFlatValue] = useState<Price[]>([]);
  const [includeTax, setIncludeTax] = useState(false);
  const [currencies, setCurrencies] = useState<string[]>([])
  const [minCommissionEnabled, setMinCommissionEnabled] = useState<boolean>(false)
  const [maxCommissionEnabled, setMaxCommissionEnabled] = useState<boolean>(false)
  const [minCommission, setMinCommission] = useState<Price[]>([]);
  const [maxCommission, setMaxCommission] = useState<Price[]>([]);
  const [loading, setLoading] = useState(false);

  const { product_types } = useProductTypes({ fields: "id,value", limit: 9999 });
  const { product_categories } = useProductCategories({
    fields: "id,name",
    limit: 9999,
  });
  const { sellers } = useSellers({ fields: "id,name", limit: 9999 });

  const [showSellers, setShowSellers] = useState(false);
  const [showProductTypes, setShowProductTypes] = useState(false);
  const [showProductCategories, setShowProductCategories] = useState(false);

  const [seller, setSeller] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");

  const { mutateAsync: createCommissionRule } = useCreateCommisionRule({});

  const { stores } = useStores()
  
  useEffect(()=>{
    if(stores && stores[0]) {
      setCurrencies(stores[0].supported_currencies.map(c => c.currency_code))
    }
  }, [stores])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let reference_id = "";
      switch (reference) {
        case "seller":
          reference_id = seller;
          break;
        case "product_type":
          reference_id = type;
          break;
        case "product_category":
          reference_id = category;
          break;
        case "seller+product_type":
          reference_id = `${seller}+${type}`;
          break;
        case "seller+product_category":
          reference_id = `${seller}+${category}`;
          break;
      }

      const rule_payload = {
        name,
        reference,
        reference_id,
        is_active: true,
        rate: {
          type: rateType as "flat" | "percentage",
          percentage_rate: rateType === "percentage" ? ratePercentValue : undefined,
          include_tax: includeTax,
          price_set: rateType === "flat" ? rateFlatValue : undefined,
          min_price_set: minCommissionEnabled ? minCommission : undefined,
          max_price_set: maxCommissionEnabled ? maxCommission : undefined,
        },
      };

      await createCommissionRule(rule_payload);
      setLoading(false);
      toast.success("Created!");
      onSuccess?.();
    } catch (e: any) {
      toast.error("Error!");
      console.error(e);
      setLoading(false);
    }
  };
  useEffect(() => {
    if (reference === "seller") {
      setShowSellers(true);
      setShowProductCategories(false);
      setShowProductTypes(false);
    }

    if (reference === "product_category") {
      setShowSellers(false);
      setShowProductCategories(true);
      setShowProductTypes(false);
    }

    if (reference === "product_type") {
      setShowSellers(false);
      setShowProductCategories(false);
      setShowProductTypes(true);
    }

    if (reference === "seller+product_type") {
      setShowSellers(true);
      setShowProductCategories(false);
      setShowProductTypes(true);
    }

    if (reference === "seller+product_category") {
      setShowSellers(true);
      setShowProductCategories(true);
      setShowProductTypes(false);
    }
  }, [reference]);

  return (
    <form onSubmit={onSubmit}>
      <fieldset>
        <legend className="mb-2">Rule Name</legend>
        <Input
          name="name"
          placeholder="Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </fieldset>
      <fieldset className="my-4">
        <legend className="mb-2">Rule Type</legend>
        <Select
          value={reference}
          onValueChange={(value) => {
            setReference(value);
          }}
        >
          <Select.Trigger>
            <Select.Value placeholder="Type" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="seller">Seller</Select.Item>
            <Select.Item value="product_type">Product type</Select.Item>
            <Select.Item value="product_category">Product category</Select.Item>
            <Select.Item value="seller+product_type">
              Seller + Product type
            </Select.Item>
            <Select.Item value="seller+product_category">
              Seller + Product category
            </Select.Item>
          </Select.Content>
        </Select>
      </fieldset>
      <fieldset className="my-4">
        <legend className="mb-2">Attribute</legend>
        {showSellers && sellers && (
          <Select
            value={seller}
            onValueChange={(value) => {
              setSeller(value);
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Seller" />
            </Select.Trigger>
            <Select.Content>
              {sellers.map((s) => {
                return <Select.Item value={s.id}>{s.name}</Select.Item>;
              })}
            </Select.Content>
          </Select>
        )}
        {showProductCategories && product_categories && (
          <Select
            value={category}
            onValueChange={(value) => {
              setCategory(value);
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Product category" />
            </Select.Trigger>
            <Select.Content>
              {product_categories.map((s) => {
                return <Select.Item value={s.id}>{s.name}</Select.Item>;
              })}
            </Select.Content>
          </Select>
        )}
        {showProductTypes && product_types && (
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value);
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Product type" />
            </Select.Trigger>
            <Select.Content>
              {product_types.map((s) => {
                return <Select.Item value={s.id}>{s.value}</Select.Item>;
              })}
            </Select.Content>
          </Select>
        )}
      </fieldset>
      <fieldset className="my-4">
        <div className="flex items-center gap-x-2">
          <Switch
            id="include_tax"
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
            onCheckedChange={(val) => {
              setRateType(val ? "percentage" : "flat");
            }}
          />
          <Label>Percentage</Label>
        </div>
      </fieldset>
      <fieldset className="my-4">
        <legend className="mb-2">
          Fee value
        </legend>
        {rateType === "percentage" && 
          <Input
            name="rate_percent_value"
            type="number"
            value={ratePercentValue}
            onChange={(e) => setRatePercentValue(parseFloat(e.target.value))}
          />
        }
        {rateType === "flat" && currencies && currencies.map(currency => {
          return  <>
            <Label>{currency.toUpperCase()}</Label>
            <Input
              name={"rate_flat_val" + {currency}}
              type="number"
              value={rateFlatValue.filter(v => v.currency_code === currency)[0]?.amount || 0}
              onChange={(e) => setRateFlatValue((prevValue)=>{
                return [ 
                  ...prevValue.filter(v=>v.currency_code !== currency), 
                  {currency_code: currency, amount: parseFloat(e.target.value)}
                ]
              })}
            />
          </>
        })}
      </fieldset>
      {rateType === "percentage" && (
        <>
          <fieldset className="my-4">
            <div className="flex items-center gap-x-2">
              <Label>Minimum commission value</Label>
              <Switch
                id="min_com"
                checked={minCommissionEnabled}
                onCheckedChange={(val) => {
                  setMinCommissionEnabled(val);
                }}
              />
            </div>
            {minCommissionEnabled && currencies && currencies.map(currency => {
              return  <>
                    <Label>{currency.toUpperCase()}</Label>
                    <Input
                      name={"min_com_val" + {currency}}
                      type="number"
                      value={minCommission.filter(v => v.currency_code === currency)[0]?.amount || 0}
                      onChange={(e) => setMinCommission((prevValue)=>{
                        return [ 
                          ...prevValue.filter(v=>v.currency_code !== currency), 
                          {currency_code: currency, amount: parseFloat(e.target.value)}
                        ]
                      })}
                    />
                </>
            })}
          </fieldset>
          <fieldset className="my-4">
            <div className="flex items-center gap-x-2">
              <Label>Maximum commission value</Label>
              <Switch
                id="max_com"
                checked={maxCommissionEnabled}
                onCheckedChange={(val) => {
                  setMaxCommissionEnabled(val);
                }}
              />
            </div>
            {maxCommissionEnabled && currencies && currencies.map(currency => {
              return  <>
                    <Label>{currency.toUpperCase()}</Label>
                    <Input
                      name={"max_com_val" + {currency}}
                      type="number"
                      value={maxCommission.filter(v => v.currency_code === currency)[0]?.amount || 0}
                      onChange={(e) => setMaxCommission((prevValue)=>{
                        return [ 
                          ...prevValue.filter(v=>v.currency_code !== currency), 
                          {currency_code: currency, amount: parseFloat(e.target.value)}
                        ]
                      })}
                    />
                </>
            })}
          </fieldset>
        </>
      )}
      <Button type="submit" isLoading={loading}>
        Create
      </Button>
    </form>
  );
};

export default CreateCommissionRuleForm;
