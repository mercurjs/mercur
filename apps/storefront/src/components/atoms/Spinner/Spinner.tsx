export const Spinner = ({ "data-testid": dataTestId }: { "data-testid"?: string }) => {
  return (
    <div
      className="w-4 h-4 border-2 border-primary border-b-transparent rounded-full animate-spin"
      data-testid={dataTestId ?? 'spinner'}
    ></div>
  )
}
