import { Button, Card } from "@/components/atoms"
import { convertToLocale } from "@/lib/helpers/money"
import Image from "next/image"

export const ReturnSummaryTab = ({
  selectedItems,
  items,
  currency_code,
  note,
  onNoteChange,
  submitting,
  handleSubmit,
}: {
  selectedItems: Array<{ id: string }>
  items: any[]
  currency_code: string
  note: string
  onNoteChange: (value: string) => void
  submitting: boolean
  handleSubmit: () => void
}) => {
  const selected = items.filter((item) =>
    selectedItems.some((i) => i.id === item.id)
  )

  const subtotal = selected.reduce((acc, item) => acc + item.subtotal, 0)

  return (
    <div>
      {selected.length ? (
        <Card className="p-4">
          <ul>
            {selected.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 mb-4 justify-between w-full"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <div className="w-16 rounded-sm border">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt={item.subtitle}
                        width={64}
                        height={64}
                        className="rounded-sm"
                      />
                    ) : (
                      <Image
                        src={"/images/placeholder.svg"}
                        alt={item.subtitle}
                        width={64}
                        height={64}
                        className="opacity-25 scale-75"
                      />
                    )}
                  </div>
                  {item.subtitle}
                </div>
                <div>
                  {convertToLocale({ amount: item.subtotal, currency_code })}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-4">
        <label className="label-md block mb-2" htmlFor="return-request-note">
          Note for the seller (optional)
        </label>
        <textarea
          id="return-request-note"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full rounded-lg border bg-component-secondary px-4 py-3 text-base-regular focus:outline-none"
          placeholder="Tell the seller what happened"
        />
      </Card>

      <Card className="p-4">
        <p className="label-md flex justify-between mb-4">
          Subtotal refund:
          <span className="label-md !font-bold text-primary">
            {convertToLocale({ amount: subtotal, currency_code })}
          </span>
        </p>
        <p className="label-sm text-secondary mb-4">
          The seller reviews your request first. The refund is issued once the
          marketplace approves it.
        </p>
        <Button
          className="label-md w-full uppercase"
          disabled={!selected.length || submitting}
          onClick={handleSubmit}
        >
          {selected.length ? "Request return" : "Select items"}
        </Button>
      </Card>
    </div>
  )
}
