import { sdk } from "@lib/client"

type UploadResponse = { files?: { url: string }[] }

export const uploadRichTextImage = async (file: File): Promise<string> => {
  const { files } = (await sdk.vendor.uploads.mutate({
    files: [file],
  })) as UploadResponse
  const url = files?.[0]?.url

  if (!url) {
    throw new Error("Upload did not return a file url")
  }

  return url
}
