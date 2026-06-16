import { UIMatch } from "react-router-dom";

import { useCommissionRule } from "../../../hooks/api/commissions";

type CommissionRuleBreadcrumbProps = UIMatch<{
  commission_rate?: { name?: string };
}>;

export const CommissionRuleBreadcrumb = (
  props: CommissionRuleBreadcrumbProps
) => {
  const { id } = props.params || {};

  const { commission_rate } = useCommissionRule(
    id!,
    undefined,
    {
      initialData: props.data,
      enabled: Boolean(id),
    }
  ) as unknown as { commission_rate?: { name?: string } };

  if (!commission_rate) {
    return null;
  }

  return <span>{commission_rate.name}</span>;
};
