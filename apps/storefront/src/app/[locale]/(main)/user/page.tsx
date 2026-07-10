import { UserNavigation } from "@/components/molecules"
import { retrieveCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"

export default async function UserPage() {
  const user = await retrieveCustomer()

  if (!user) {
    redirect("/login")
  }
  
  return (
    <main className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3">
          <h1 className="heading-xl uppercase">Welcome {user.first_name}</h1>
          <p className="label-md">Your account is ready to go!</p>
        </div>
      </div>
    </main>
  )
}
