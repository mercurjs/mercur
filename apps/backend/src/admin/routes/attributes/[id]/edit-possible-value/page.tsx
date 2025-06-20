import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Drawer, Heading, Text, Button, Input, toast, Label } from "@medusajs/ui"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { MetadataEditor } from "../../../../components/metadata-editor"
import { useAttribute } from "../../../../hooks/api/attributes"
import { useUpdateAttributePossibleValue } from "../../../../hooks/api/attributes"

const formSchema = z.object({
  value: z.string().min(1, "Value is required"),
  rank: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "Rank must be non-negative").optional()
  ),
  metadata: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).default([]),
})

type FormValues = z.infer<typeof formSchema>

const EditPossibleValuePage = () => {
  const { id: attributeId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const possibleValueId = searchParams.get("possible_value_id")

  const { attribute, isLoading: isAttributeLoading } = useAttribute(attributeId!, {
    fields: 'possible_values.*'
  }, {
    enabled: !!attributeId,
  })

  const { mutateAsync, isPending } = useUpdateAttributePossibleValue(attributeId!, possibleValueId!) 

  const possibleValue = attribute?.possible_values?.find((pv: { id: string }) => pv.id === possibleValueId)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
      rank: undefined,
      metadata: [],
    },
  })

  useEffect(() => {
    if (possibleValue) {
      const metadataArray = Object.entries(possibleValue.metadata || {}).map(([key, value]) => ({ key, value: String(value) }))
      form.reset({
        value: possibleValue.value,
        rank: possibleValue.rank,
        metadata: metadataArray.length > 0 ? metadataArray : [{ key: "", value: "" }],
      })
    }
  }, [possibleValue, form])

  const handleSave = form.handleSubmit(async (data) => {
    const transformedMetadata = data.metadata.reduce((acc, item) => {
      // Only include valid key-value pairs where both key and value are non-empty
      if (item.key.trim() !== "" && item.value.trim() !== "") {
        acc[item.key] = item.value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    await mutateAsync(
      {
        value: data.value,
        rank: data.rank,
        //@ts-ignore
        metadata:
          Object.keys(transformedMetadata).length > 0
            ? transformedMetadata
            : null,
      },
      {
        onSuccess: () => {
          toast.success("Possible value updated!");
          navigate(-1);
        },
        onError: (error) => {
          toast.error("Failed to update possible value");
          console.error(error);
        },
      }
    );
  });

  const handleClose = () => {
    navigate(`/attributes/${attributeId}`)
  }

  return (
    <Drawer open={true} onOpenChange={(open) => { if (!open) handleClose() }}>
      <Drawer.Content>
        {isAttributeLoading ? (
          <>
            <Drawer.Header>
              <Heading>Loading...</Heading>
            </Drawer.Header>
            <Drawer.Body>
              <Text>Fetching possible value details...</Text>
            </Drawer.Body>
          </>
        ) : !possibleValue ? (
          <>
            <Drawer.Header>
              <Heading>Possible Value Not Found</Heading>
            </Drawer.Header>
            <Drawer.Body>
              <Text>The requested possible value could not be found.</Text>
              <Button onClick={handleClose}>Close</Button>
            </Drawer.Body>
          </>
        ) : (
          <>
            <Drawer.Header>
              <Drawer.Title>Edit Possible Value</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <form id="edit-possible-value-form" onSubmit={handleSave}>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="value">Value</Label>
                    <Input
                      id="value"
                      {...form.register("value")}
                    />
                    {form.formState.errors.value && (
                      <Text className="text-red-500 text-sm mt-1">
                        {form.formState.errors.value.message}
                      </Text>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="rank">Rank</Label>
                    <Input
                      id="rank"
                      type="number"
                      {...form.register("rank", { valueAsNumber: true })}
                    />
                    {form.formState.errors.rank && (
                      <Text className="text-red-500 text-sm mt-1">
                        {form.formState.errors.rank.message}
                      </Text>
                    )}
                  </div>

                  <MetadataEditor form={form} />
                </div>
              </form>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="secondary" onClick={handleClose} disabled={!!isPending}>Cancel</Button>
              <Button type="submit" form="edit-possible-value-form" disabled={!!isPending}>Save</Button>
            </Drawer.Footer>
          </>
        )}
      </Drawer.Content>
    </Drawer>
  )
}

export const config = defineRouteConfig({})

export default EditPossibleValuePage 