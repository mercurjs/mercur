import { UIMatch } from "react-router-dom";
import { useRequest } from "../../../../hooks/api/requests";

export const Breadcrumb = (props: UIMatch) => {
  const { type, id } = props.params || {};

  const { request } = useRequest(type!, id!, undefined, {
    enabled: Boolean(type && id),
  });

  if (!request) {
    return null;
  }

  return <span>{request.id}</span>;
};
