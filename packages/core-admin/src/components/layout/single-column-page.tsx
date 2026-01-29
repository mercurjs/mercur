import { ReactNode } from 'react'

interface SingleColumnPageProps {
  children: ReactNode
  className?: string
}

export function SingleColumnPage({ children, className = '' }: SingleColumnPageProps) {
  return (
    <div className={`flex flex-col gap-y-4 ${className}`}>
      {children}
    </div>
  )
}
