import config from "virtual:mercur/config"

export default function imagesConverter(images: string) {
  const isLocalhost =
    images.startsWith("http://localhost:9000") ||
    images.startsWith("https://localhost:9000")

  if (isLocalhost) {
    return images
      .replace("http://localhost:9000", config.backendUrl)
      .replace("https://localhost:9000", config.backendUrl)
  }

  return images
}
