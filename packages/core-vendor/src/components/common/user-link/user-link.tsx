import { Avatar, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { useUser } from "../../../hooks/api/users"

type UserLinkProps = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email: string
  type?: "customer" | "user"
}

export const UserLink = ({
  id,
  first_name,
  last_name,
  email,
  type = "user",
}: UserLinkProps) => {
  const name = [first_name, last_name].filter(Boolean).join(" ")
  const fallback = name ? name.slice(0, 1) : email.slice(0, 1)
  const link = type === "user" ? `/settings/users/${id}` : `/customers/${id}`

  return (
    <Link
      to={link}
      className="flex items-center gap-x-2 w-fit transition-fg hover:text-ui-fg-subtle outline-none focus-visible:shadow-borders-focus rounded-md"
    >
      <Avatar size="2xsmall" fallback={fallback.toUpperCase()} />
      <Text size="small" leading="compact" weight="regular">
        {name || email}
      </Text>
    </Link>
  )
}

export const By = ({ id }: { id: string }) => {
  const { user } = useUser(id) // todo: extend to support customers

  if (!user) {
    return null
  }

  return <UserLink {...user} />
}
