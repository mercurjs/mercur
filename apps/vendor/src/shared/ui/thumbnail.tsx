import { cn } from '../lib'

export const Thumbnail = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'w-[48px] h-[36px] border rounded-md bg-gradient-to-b from-[#E5FFE5] to-[#f2fffd]',
        className
      )}
    />
  )
}
