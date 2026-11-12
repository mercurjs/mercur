import { TFunction } from "i18next"

export function getIsInternalProps(
  isInternal: boolean,
  t: TFunction
): { color: "blue" | "green"; label: string } {
  if (isInternal) {
    return { label: t("attributes.fields.visibility.internal"), color: "blue" }
  }
  return { label: t("attributes.fields.visibility.public"), color: "green" }
}
