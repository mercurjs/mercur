'use client';

import { useEffect, useRef } from 'react';

import Talk from 'talkjs';

type ChatProps = {
  order_id?: string;
  product_id?: string;
  subject?: string | null;
  currentUser: {
    id: string;
    name: string;
    email: string | null;
    photoUrl?: string;
    role: string;
  };
  supportUser: {
    id: string;
    name: string;
    email: string | null;
    photoUrl?: string;
    role: string;
  };
};

export function ChatBox({ currentUser, supportUser, subject, order_id, product_id }: ChatProps) {
  const chatboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser?.id || !supportUser?.id || !currentUser?.email || !supportUser?.email) {
      console.error('TalkJS: Missing required user data');
      return;
    }

    let session: Talk.Session | undefined;

    Talk.ready.then(() => {
      const me = new Talk.User({
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email || undefined,
        photoUrl: currentUser.photoUrl,
        role: currentUser.role
      });

      const other = new Talk.User({
        id: supportUser.id,
        name: supportUser.name,
        email: supportUser.email || undefined,
        photoUrl: supportUser.photoUrl,
        role: supportUser.role
      });

      session = new Talk.Session({
        appId: process.env.NEXT_PUBLIC_TALKJS_APP_ID || '',
        me
      });

      const conversationId = `product-${product_id || order_id}-${me.id}-${other.id}`;

      const conversation = session.getOrCreateConversation(conversationId);

      if (subject) {
        conversation.subject = subject;
      }

      conversation.setParticipant(me);
      conversation.setParticipant(other);

      const chatbox = session.createChatbox();
      chatbox.select(conversation);
      if (chatboxRef.current) {
        chatbox.mount(chatboxRef.current);
      }
    });

    return () => session?.destroy();
  }, [
    currentUser.id,
    currentUser.name,
    currentUser.email,
    currentUser.photoUrl,
    currentUser.role,
    supportUser.id,
    supportUser.name,
    supportUser.email,
    supportUser.photoUrl,
    supportUser.role,
    subject,
    order_id,
    product_id
  ]);

  return (
    <div
      className="h-[500px] w-full"
      ref={chatboxRef}
    />
  );
}
