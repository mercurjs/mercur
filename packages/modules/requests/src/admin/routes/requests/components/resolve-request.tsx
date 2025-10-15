import { Button, Input, Prompt, toast } from "@medusajs/ui";
import { useReviewRequest } from "../../../hooks/api/requests";
import { useEffect, useState } from "react";

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
    } catch (e: any) {
      toast.error(`Error: ${e.error.message}`);
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
