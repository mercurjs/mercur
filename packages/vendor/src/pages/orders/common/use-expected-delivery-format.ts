import { useDate } from "@hooks/use-date"

import { ExpectedDelivery, parseCalendarDate } from "./expected-delivery"

export const useExpectedDeliveryFormat = () => {
  const { getFullDate } = useDate()

  const formatCalendarDate = (value: string | null) => {
    if (!value) {
      return null
    }

    const date = parseCalendarDate(value)

    return date ? getFullDate({ date }) : null
  }

  const formatDeliveryWindow = (delivery: ExpectedDelivery) => {
    const earliest = formatCalendarDate(delivery.earliest)
    const latest = formatCalendarDate(delivery.latest)

    if (earliest && latest) {
      return earliest === latest ? earliest : `${earliest} – ${latest}`
    }

    return earliest ?? latest ?? "—"
  }

  return { formatCalendarDate, formatDeliveryWindow }
}
