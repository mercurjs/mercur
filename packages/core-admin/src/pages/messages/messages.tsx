import { useCallback } from "react";

import { Container, Heading, Text } from "@medusajs/ui";

import { Inbox, Session } from "@talkjs/react";
import Talk from "talkjs";

import { useTalkJS } from "@hooks/api/messages";
import { Spinner } from "@medusajs/icons";

export const Messages = () => {
  const { isLoading } = useTalkJS();

  const syncUser = useCallback(
    () =>
      new Talk.User({
        id: "admin",
        name: "Admin",
      }),
    [],
  );

  const talkJsAppId = __TALK_JS_APP_ID__;

  return (
    <Container className="divide-y p-0 min-h-[700px]" data-testid="messages-container">
      <div className="flex items-center justify-between px-6 py-4" data-testid="messages-header">
        <div>
          <Heading data-testid="messages-heading">Messages</Heading>
        </div>
      </div>
      <div className="px-6 py-4 h-[655px]" data-testid="messages-content">
        {isLoading ? (
          <div className="flex items-center justify-center" data-testid="messages-loading">
            <Spinner className="text-ui-fg-interactive animate-spin" data-testid="messages-loading-spinner" />
          </div>
        ) : talkJsAppId ? (
          <div className="h-full" data-testid="messages-inbox">
            <Session appId={talkJsAppId} syncUser={syncUser}>
              <Inbox className="h-full" />
            </Session>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full h-full justify-center" data-testid="messages-no-app-id">
            <Heading data-testid="messages-no-app-id-heading">No TalkJS App ID</Heading>
            <Text className="text-ui-fg-subtle mt-4" size="small" data-testid="messages-no-app-id-description">
              Connect TalkJS to manage your messages
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
};
