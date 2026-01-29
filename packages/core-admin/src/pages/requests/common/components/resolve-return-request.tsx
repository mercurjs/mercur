import { useEffect, useState } from "react";

import { Button, Input, Prompt, toast } from "@medusajs/ui";

import { useReviewReturnRequest } from "@hooks/api/return-requests";

type Props = {
  close: () => void;
  onSuccess?: () => void;
  open: boolean;
  id: string;
  accept: boolean;
};

export function ResolveReturnRequestPrompt({
  open,
  id,
  accept,
  close,
  onSuccess,
}: Props) {
  const [note, setNote] = useState("");
  const { mutateAsync: reviewRequest } = useReviewReturnRequest({});

  useEffect(() => {
    setNote("");
  }, [open, id, accept]);

  const handleReview = async () => {
    try {
      const status = accept ? "refunded" : "canceled";
      await reviewRequest({
        id,
        payload: {
          admin_reviewer_note: note,
          status,
        },
      });
      toast.success(`Successfuly ${status}!`);
      onSuccess?.();
    } catch {
      toast.error("Error!");
    } finally {
      close();
    }
  };

  return (
    <Prompt open={open} data-testid={`resolve-return-request-prompt-${id}`}>
      <Prompt.Content data-testid={`resolve-return-request-prompt-${id}-content`}>
        <Prompt.Header data-testid={`resolve-return-request-prompt-${id}-header`}>
          <Prompt.Title data-testid={`resolve-return-request-prompt-${id}-title`}>
            {accept ? "Accept request?" : "Reject request?"}
          </Prompt.Title>
          <Prompt.Description data-testid={`resolve-return-request-prompt-${id}-description`}>
            You can provide short note on your decision
          </Prompt.Description>
          <Input
            name="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            data-testid={`resolve-return-request-prompt-${id}-note-input`}
          />
        </Prompt.Header>
        <Prompt.Footer data-testid={`resolve-return-request-prompt-${id}-footer`}>
          <Button variant="secondary" onClick={close} data-testid={`resolve-return-request-prompt-${id}-cancel-button`}>
            Cancel
          </Button>
          <Button onClick={handleReview} data-testid={`resolve-return-request-prompt-${id}-submit-button`}>Submit</Button>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
}
