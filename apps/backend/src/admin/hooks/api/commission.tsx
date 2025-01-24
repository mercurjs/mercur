import { useEffect, useState } from "react";

import { AdminComissionRule, Api } from "@mercurjs/http-client";

export const useCommissionRules = () => {
  const api = new Api();

  const [data, setData] = useState<AdminComissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.admin.adminListComissionRules();
        setData(data.products || []);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [refetchTrigger]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};
