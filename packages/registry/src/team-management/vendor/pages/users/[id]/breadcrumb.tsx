import { UIMatch } from "react-router-dom"

import { useMember } from "../../../hooks/api/members"

export const Breadcrumb = (props: UIMatch) => {
  const { id } = props.params || {}

  const { member } = useMember(id!, undefined, {
    enabled: Boolean(id),
  })

  if (!member) {
    return null
  }

  return <span>{member.name || member.email || member.id}</span>
}
