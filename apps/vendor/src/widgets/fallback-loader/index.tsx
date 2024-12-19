import { Spinner } from '@/shared/ui'

export const FallbackLoader = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner className="animate-spin text-muted-foreground h-4 w-4" />
    </div>
  )
}
