import { useEffect, useState } from "react";
import { Input, Button, Select, toast, Switch, Label } from "@medusajs/ui";
import {
  useProductCategories,
  useProductTypes,
} from "../../../../hooks/api/product";
import { useSellers } from "../../../../hooks/api/seller";
import { useCreateCommisionRule } from "../../../../hooks/api/commission";

type Props = {
  onSuccess?: () => void;
};

const CreateCommissionRuleForm = ({ onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [reference, setReference] = useState("seller");
  const [rateType, setRateType] = useState("flat");
  const [rateValue, setRateValue] = useState(0);
  const [includeTax, setIncludeTax] = useState(false);
  const [minCommission, setMinCommission] = useState<number | null>(null);
  const [maxCommission, setMaxCommission] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const { product_types } = useProductTypes({ fields: "id,value", limit: 999 });
  const { product_categories } = useProductCategories({
    fields: "id,name",
    limit: 999,
  });
  const { sellers } = useSellers({ fields: "id,name", limit: 999 });

  const [showSellers, setShowSellers] = useState(false);
  const [showProductTypes, setShowProductTypes] = useState(false);
  const [showProductCategories, setShowProductCategories] = useState(false);

  const [seller, setSeller] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");

  const { mutateAsync: createCommissionRule } = useCreateCommisionRule({});

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
          percentage_rate: rateType === "percentage" ? rateValue : undefined,
          include_tax: includeTax,
          price_set: rateType === "flat" ? { amount: rateValue } : undefined,
          min_price_set: minCommission ? { amount: minCommission } : undefined,
          max_price_set: maxCommission ? { amount: maxCommission } : undefined,
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

export default CreateCommissionRuleForm;
