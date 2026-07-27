'use client';

import { ReactNode } from 'react';

import { Session } from '@talkjs/react';
import Talk from 'talkjs';

type TalkJsProviderProps = {
  appId: string;
  userId: string;
  userName: string;
  userEmail: string;
  children: ReactNode;
};

export function TalkJsProvider({
  appId,
  userId,
  userName,
  userEmail,
  children
}: TalkJsProviderProps) {
  return (
    <Session
      appId={appId}
      syncUser={() =>
        new Talk.User({
          id: userId,
          name: userName,
          email: userEmail,
          photoUrl: '/talkjs-placeholder.jpg',
          role: 'customer'
        })
      }
    >
      {children}
    </Session>
  );
}
