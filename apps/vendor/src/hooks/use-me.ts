import { useQuery } from "@tanstack/react-query";
import { client } from "../lib/client";

export const useMe = (
) => {
  const { data, ...rest } = useQuery({
    queryKey: ['members', 'me'],
    queryFn: () => client.vendor.members.me.query(),
  });

  return { ...data, ...rest };
};
