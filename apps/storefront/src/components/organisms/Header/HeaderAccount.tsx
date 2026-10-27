import { UserDropdown } from "@/components/cells/UserDropdown/UserDropdown"
import { MessageButton } from "@/components/molecules/MessageButton/MessageButton"
import { CustomerTalkJsProvider } from "@/components/providers/TalkJs/CustomerTalkJsProvider"
import { retrieveCustomer } from "@/lib/data/customer"

export const HeaderAccount = async () => {
  const user = await retrieveCustomer().catch(() => null)
  const isLoggedIn = Boolean(user)

  return (
    <CustomerTalkJsProvider>
      {isLoggedIn && <MessageButton />}
      <UserDropdown isLoggedIn={isLoggedIn} />
    </CustomerTalkJsProvider>
  )
}

export const HeaderAccountFallback = () => <UserDropdown isLoggedIn={false} />
