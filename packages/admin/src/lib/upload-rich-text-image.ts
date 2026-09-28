import { sdk } from "@lib/client"

export const uploadRichTextImage = async (file: File): Promise<string> => {
  const { files } = await sdk.admin.uploads.mutate({ files: [file] })
  const url = files?.[0]?.url

  if (!url) {
    throw new Error("Upload did not return a file url")
  }

  return url
}
