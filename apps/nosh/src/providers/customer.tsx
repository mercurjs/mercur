import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/sdk"

interface CustomerContextValue {
  customer: HttpTypes.StoreCustomer | undefined
  setCustomer: React.Dispatch<React.SetStateAction<HttpTypes.StoreCustomer | undefined>>
  refreshCustomer: () => Promise<void>
  isLoggedIn: boolean
  isLoading: boolean
}

const CustomerContext = createContext<CustomerContextValue | null>(null)

interface CustomerProviderProps {
  children: React.ReactNode
}

export function CustomerProvider({ children }: CustomerProviderProps) {
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  async function refreshCustomer(): Promise<void> {
    try {
      setIsLoading(true)
      const { customer } = await sdk.store.customer.retrieve()
      setCustomer(customer)
    } catch {
      // not logged in or token invalid; clear local state
      setCustomer(undefined)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Always attempt initial retrieval on mount
    // This ensures correct state when app launches
    refreshCustomer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<CustomerContextValue>(
    () => ({ customer, setCustomer, refreshCustomer, isLoggedIn: Boolean(customer), isLoading }),
    [customer, isLoading]
  )

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>
}

export function useCustomer(): CustomerContextValue {
  const ctx = useContext(CustomerContext)
  if (!ctx) throw new Error("useCustomer must be used within a CustomerProvider")
  return ctx
}


