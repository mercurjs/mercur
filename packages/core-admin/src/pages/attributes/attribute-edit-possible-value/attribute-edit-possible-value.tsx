import {
  Drawer,
  Heading,
  Text,
  Button,
  Input,
  toast,
  Label,
} from "@medusajs/ui";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MetadataEditor } from "../../../components/common/metadata-editor";
import { useAttribute } from "../../../hooks/api/attributes";
import { useUpdateAttributePossibleValue } from "../../../hooks/api/attributes";

const formSchema = z.object({
  value: z.string().min(1, "Value is required"),
  rank: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "Rank must be non-negative").optional()
  ),
  metadata: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .default([]),
});

type FormValues = z.infer<typeof formSchema>;

export const EditPossibleValue = () => {
  const { id: attributeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const possibleValueId = searchParams.get("possible_value_id");

  const { attribute, isLoading: isAttributeLoading } = useAttribute(
    attributeId!,
    {
      fields: "possible_values.*",
    },
    {
      enabled: !!attributeId,
    }
  );

  const { mutateAsync, isPending } = useUpdateAttributePossibleValue(
    attributeId!,
    possibleValueId!
  );

  const possibleValue = attribute?.possible_values?.find(
    (pv: { id: string }) => pv.id === possibleValueId
  );

  const originalMetadataRef = useRef<Record<string, unknown>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
      rank: undefined,
      metadata: [],
    },
  });

  useEffect(() => {
    if (possibleValue) {
      const originalMetadata = possibleValue.metadata || {};
      originalMetadataRef.current = originalMetadata;

      const metadataArray = Object.entries(originalMetadata).map(
        ([key, value]) => ({ key, value: String(value) })
      );
      form.reset({
        value: possibleValue.value,
        rank: possibleValue.rank,
        metadata:
          metadataArray.length > 0 ? metadataArray : [{ key: "", value: "" }],
      });
    }
  }, [possibleValue, form]);

  const handleSave = form.handleSubmit(async (data) => {
    const transformedMetadata = data.metadata.reduce(
      (acc, item) => {
        // Only include valid key-value pairs where both key and value are non-empty
        if (item.key.trim() !== "" && item.value.trim() !== "") {
          acc[item.key] = item.value;
        }

        return acc;
      },
      {} as Record<string, unknown>
    );

    const finalMetadata: Record<string, unknown> = { ...transformedMetadata };

    const originalKeys = Object.keys(originalMetadataRef.current);
    const newKeys = Object.keys(transformedMetadata);

    originalKeys.forEach((key) => {
      if (!newKeys.includes(key)) {
        finalMetadata[key] = "";
      }
    });

    await mutateAsync(
      {
        value: data.value,
        rank: data.rank,
        metadata: finalMetadata,
      },
      {
        onSuccess: () => {
          toast.success("Possible value updated!");
          navigate(-1);
        },
        onError: () => {
          toast.error("Failed to update possible value");
        },
      }
    );
  });

  const handleClose = () => {
    navigate(`/settings/attributes/${attributeId}`);
  };

  return (
    <Drawer
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      data-testid="attribute-edit-possible-value-drawer"
    >
      <Drawer.Content data-testid="attribute-edit-possible-value-drawer-content">
        {isAttributeLoading ? (
          <>
            <Drawer.Header data-testid="attribute-edit-possible-value-loading-header">
              <Heading>Loading...</Heading>
            </Drawer.Header>
            <Drawer.Body data-testid="attribute-edit-possible-value-loading-body">
              <Text>Fetching possible value details...</Text>
            </Drawer.Body>
          </>
        ) : !possibleValue ? (
          <>
            <Drawer.Header data-testid="attribute-edit-possible-value-not-found-header">
              <Heading>Possible Value Not Found</Heading>
            </Drawer.Header>
            <Drawer.Body data-testid="attribute-edit-possible-value-not-found-body">
              <Text>The requested possible value could not be found.</Text>
              <Button onClick={handleClose} data-testid="attribute-edit-possible-value-close-button">Close</Button>
            </Drawer.Body>
          </>
        ) : (
          <>
            <Drawer.Header data-testid="attribute-edit-possible-value-drawer-header">
              <Drawer.Title data-testid="attribute-edit-possible-value-drawer-title">Edit Possible Value</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body data-testid="attribute-edit-possible-value-drawer-body">
              <form id="edit-possible-value-form" onSubmit={handleSave} data-testid="attribute-edit-possible-value-form">
                <div className="grid gap-4">
                  <div data-testid="attribute-edit-possible-value-value-field">
                    <Label htmlFor="value" data-testid="attribute-edit-possible-value-value-label">Value</Label>
                    <Input id="value" {...form.register("value")} data-testid="attribute-edit-possible-value-value-input" />
                    {form.formState.errors.value && (
                      <Text className="text-red-500 text-sm mt-1" data-testid="attribute-edit-possible-value-value-error">
                        {form.formState.errors.value.message}
                      </Text>
                    )}
                  </div>
                  <div data-testid="attribute-edit-possible-value-rank-field">
                    <Label htmlFor="rank" data-testid="attribute-edit-possible-value-rank-label">Rank</Label>
                    <Input
                      id="rank"
                      type="number"
                      {...form.register("rank", { valueAsNumber: true })}
                      data-testid="attribute-edit-possible-value-rank-input"
                    />
                    {form.formState.errors.rank && (
                      <Text className="text-red-500 text-sm mt-1" data-testid="attribute-edit-possible-value-rank-error">
                        {form.formState.errors.rank.message}
                      </Text>
                    )}
                  </div>

                  <MetadataEditor form={form} />
                </div>
              </form>
            </Drawer.Body>
            <Drawer.Footer data-testid="attribute-edit-possible-value-drawer-footer">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={!!isPending}
                data-testid="attribute-edit-possible-value-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-possible-value-form"
                disabled={!!isPending}
                data-testid="attribute-edit-possible-value-save-button"
              >
                Save
              </Button>
            </Drawer.Footer>
          </>
        )}
      </Drawer.Content>
    </Drawer>
  );
};
