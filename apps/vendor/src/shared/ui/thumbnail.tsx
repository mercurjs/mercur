import { cn } from '../lib'

export const Thumbnail = ({
  className,
  src
}: {
  className?: string
  src?: string
}) => {
  return (
    <div
      className={cn(
        'w-[48px] h-[36px] border rounded-md',
        src ? '' : 'bg-gradient-to-b from-[#E5FFE5] to-[#f2fffd]',
        className
      )}
    >
      {src && (
        <img src={src} alt="thumbnail" className="w-full h-full object-cover" />
      )}
    </div>
  )
}
