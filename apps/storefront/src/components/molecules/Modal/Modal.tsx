import { CloseIcon } from "@/icons"

export const Modal = ({
  children,
  heading,
  onClose,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  heading: string
  onClose: () => void
  "data-testid"?: string
}) => {
  return (
    <div
      className="fixed top-0 left-0 w-full h-full flex justify-center z-30"
      data-testid={dataTestId ?? 'modal'}
    >
      <div
        className="bg-tertiary/60 w-full h-full absolute backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute bg-primary z-20 my-20 py-5 rounded-sm max-w-[600px] w-full max-h-[80vh] overflow-y-auto shadow-lg">
        <div className="uppercase flex justify-between items-center heading-md border-b px-4 pb-5">
          {heading}
          <div onClick={onClose} className="cursor-pointer">
            <CloseIcon size={20} />
          </div>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  )
}
