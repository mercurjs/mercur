import { describe, expect, test } from "vitest";

import { createCommissionRuleSchema } from "./schema";

const base = {
  title: "Standard",
  code: "standard",
  scopeType: "store" as const,
  stores: [],
  productTypes: [],
  categories: [],
  include_tax: false,
  include_shipping: false,
};

const valueIssues = (input: Record<string, unknown>, currencies: string[]) => {
  const result = createCommissionRuleSchema(currencies).safeParse(input);
  if (result.success) {
    return [];
  }
  return result.error.issues.filter(
    (issue) => issue.path[0] === "value" || issue.path[0] === "fixed_values"
  );
};

describe("createCommissionRuleSchema value validation", () => {
  test.each([undefined, null, "", NaN])(
    "flags a missing percentage value (%s) as required",
    (value) => {
      const issues = valueIssues(
        { ...base, commissionType: "percentage", value, fixed_values: {} },
        ["usd"]
      );

      expect(issues).toHaveLength(1);
      expect(issues[0].path).toEqual(["value"]);
    }
  );

  test("accepts a provided percentage value", () => {
    const issues = valueIssues(
      { ...base, commissionType: "percentage", value: 5, fixed_values: {} },
      ["usd"]
    );

    expect(issues).toHaveLength(0);
  });

  test.each([undefined, null, "", NaN])(
    "flags a missing fixed currency value (%s) as required",
    (amount) => {
      const issues = valueIssues(
        {
          ...base,
          commissionType: "fixed",
          value: undefined,
          fixed_values: { usd: amount },
        },
        ["usd"]
      );

      expect(issues).toHaveLength(1);
      expect(issues[0].path).toEqual(["fixed_values", "usd"]);
    }
  );

  test("flags a fixed currency with no entry at all", () => {
    const issues = valueIssues(
      { ...base, commissionType: "fixed", value: undefined, fixed_values: {} },
      ["usd"]
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].path).toEqual(["fixed_values", "usd"]);
  });

  test("accepts provided fixed currency values", () => {
    const issues = valueIssues(
      {
        ...base,
        commissionType: "fixed",
        value: undefined,
        fixed_values: { usd: 10 },
      },
      ["usd"]
    );

    expect(issues).toHaveLength(0);
  });
});
