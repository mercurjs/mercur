import { useEffect, useState } from "react";

import { Button, Input, Prompt, toast } from "@medusajs/ui";

import { useReviewRequest } from "@hooks/api/requests";

type Props = {
  close: () => void;
  onSuccess?: () => void;
  open: boolean;
  id: string;
  accept: boolean;
};

export function ResolveRequestPrompt({
  open,
  id,
  accept,
  close,
  onSuccess,
}: Props) {
  const [note, setNote] = useState("");
  const { mutateAsync: reviewRequest } = useReviewRequest({});

  useEffect(() => {
    setNote("");
  }, [open, id, accept]);

  const handleReview = async () => {
    try {
      const status = accept ? "accepted" : "rejected";
      await reviewRequest({
        id,
        payload: {
          reviewer_note: note,
          status,
        },
      });
      toast.success(`Successfuly ${status}!`);
      onSuccess?.();
    } catch (e: unknown) {
      toast.error(`Error: ${(e as Error).message}`);
    } finally {
      close();
    }
  };

  return (
    <Prompt open={open} data-testid={`resolve-request-prompt-${id}`}>
      <Prompt.Content data-testid={`resolve-request-prompt-${id}-content`}>
        <Prompt.Header data-testid={`resolve-request-prompt-${id}-header`}>
          <Prompt.Title data-testid={`resolve-request-prompt-${id}-title`}>
            {accept ? "Accept request?" : "Reject request?"}
          </Prompt.Title>
          <Prompt.Description data-testid={`resolve-request-prompt-${id}-description`}>
            You can provide short note on your decision
          </Prompt.Description>
          <Input
            name="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            data-testid={`resolve-request-prompt-${id}-note-input`}
          />
        </Prompt.Header>
        <Prompt.Footer data-testid={`resolve-request-prompt-${id}-footer`}>
          <Button variant="secondary" onClick={close} data-testid={`resolve-request-prompt-${id}-cancel-button`}>
            Cancel
          </Button>
          <Button onClick={handleReview} data-testid={`resolve-request-prompt-${id}-submit-button`}>Submit</Button>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
}
