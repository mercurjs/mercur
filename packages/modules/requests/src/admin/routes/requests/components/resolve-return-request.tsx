import { Button, Input, Prompt, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useReviewReturnRequest } from "../../../hooks/api/return-requests";

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
    <Prompt open={open}>
      <Prompt.Content>
        <Prompt.Header>
          <Prompt.Title>
            {accept ? "Accept request?" : "Reject request?"}
          </Prompt.Title>
          <Prompt.Description>
            You can provide short note on your decision
          </Prompt.Description>
          <Input
            name="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Prompt.Header>
        <Prompt.Footer>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleReview}>Submit</Button>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
}
