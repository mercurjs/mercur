import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getStringArrayFromSearchParams } from "../utils/search-param-utils";

export function useSearchParamsState(name: string) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const onChange = useCallback(
    (value: string | null, options: { removeState?: string[] } = {}) => {
      const { removeState } = options;
      const current = new URLSearchParams(searchParams);

      if (removeState) {
        removeState.forEach((removeName) => current.delete(removeName));
      }

      if (!value || !value.length) {
        current.delete(name);
        navigate({ search: current.toString() }, { replace: true });

        return;
      }

      if (current.has(name)) {
        current.delete(name);
      }

      current.set(name, value);
      navigate({ search: current.toString() }, { replace: true });
    },
    [searchParams]
  );

  return [
    getStringArrayFromSearchParams(name, searchParams),
    onChange,
  ] as const;
}
