export type OrderCreatedEvent = {
  email: string
  link: string
  dashboard_link: string
  order: {
    id: string
    subtotal: number
    shipping: number
    total: number
    tax: number
    payment_method: string
    date: string
    number: string
    estimated_arrival: string
    items: {
      name: string
      quantity: number
      price: number
      thumbnail: string
    }[]
  }
  vendor_orders: {
    id: string
    supplier_id: string
    supplier_name: string
    subtotal: number
    shipping: number
    total: number
    tax: number
    payment_method: string
    date: string
    number: string
    estimated_arrival: string
    items: {
      name: string
      quantity: number
      price: number
      thumbnail: string
    }[]
  }[]
}

export interface SellerRegisteredEvent {
  email: string
}

export interface SellerEmailVerifiedEvent {
  email: string
}

export interface SellerCreatedEvent {
  email: string
	link: string
}
