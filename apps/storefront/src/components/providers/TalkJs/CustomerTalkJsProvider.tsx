import { ReactNode } from 'react';

import { retrieveCustomer } from '@/lib/data/customer';

import { TalkJsProvider } from './TalkJsProvider';

export async function CustomerTalkJsProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_TALKJS_APP_ID;
  const user = await retrieveCustomer();

  if (!appId || !user?.id || !user.email) {
    return <>{children}</>;
  }

  return (
    <TalkJsProvider
      appId={appId}
      userId={user.id}
      userName={[user.first_name, user.last_name].filter(Boolean).join(' ') || 'User'}
      userEmail={user.email}
    >
      {children}
    </TalkJsProvider>
  );
}
