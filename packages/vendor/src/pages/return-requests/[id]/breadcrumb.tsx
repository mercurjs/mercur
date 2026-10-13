import { UIMatch } from "react-router-dom";

import { useReturnRequest } from "@hooks/api/return-requests";

export const Breadcrumb = (props: UIMatch) => {
  const { id } = props.params || {};

  const { return_request: returnRequest } = useReturnRequest(id!, undefined, {
    enabled: Boolean(id),
  });

  if (!returnRequest) {
    return null;
  }

  return <span>#{returnRequest.order?.display_id ?? returnRequest.id}</span>;
};
