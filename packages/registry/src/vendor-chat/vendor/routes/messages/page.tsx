import { Container, Heading, Text } from "@medusajs/ui";
import { ChatBubbleLeftRight } from "@medusajs/icons";
import { Inbox } from "@talkjs/react";
import type { RouteConfig } from "@mercurjs/dashboard-sdk";

declare const __TALK_JS_APP_ID__: string | undefined;

export const config: RouteConfig = {
  label: "Messages",
  icon: ChatBubbleLeftRight,
};

const MessagesPage = () => {
  return (
    <Container className="divide-y p-0 min-h-[700px]">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Messages</Heading>
        </div>
      </div>

      <div className="px-6 py-4 h-[655px]">
        {__TALK_JS_APP_ID__ ? (
          <Inbox className="h-full" />
        ) : (
          <div className="flex flex-col items-center w-full h-full justify-center">
            <Heading>No TalkJS App ID</Heading>
            <Text className="text-ui-fg-subtle mt-4" size="small">
              Connect TalkJS to manage your messages
            </Text>
          </div>
        )}
      </div>
    </Container>
  );
};

export default MessagesPage;
