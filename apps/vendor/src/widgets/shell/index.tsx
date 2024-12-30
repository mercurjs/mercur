import { PropsWithChildren } from 'react'
import { Suspense } from 'react'
import { AppSidebar } from '../app-sidebar'
import { FallbackLoader } from '../fallback-loader'

export const Shell = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex h-screen items-start w-full">
      <Suspense fallback={<FallbackLoader />}>
        <AppSidebar />
      </Suspense>
      <div className="flex w-full max-w-[1600px] flex-col gap-y-10 p-10">
        {children}
      </div>
    </div>
  )
}
