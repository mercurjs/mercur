import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

import schema from "../$schema.json"

const translationsDir = path.join(__dirname, "..")

function getRequiredKeysFromSchema(schema: any, prefix = ""): string[] {
  const keys: string[] = []

  if (schema.type === "object" && schema.properties) {
    Object.entries(schema.properties).forEach(([key, value]: [string, any]) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      if (value.type === "object") {
        keys.push(...getRequiredKeysFromSchema(value, newPrefix))
      } else {
        keys.push(newPrefix)
      }
    })
  }

  return keys.sort()
}

function getTranslationKeys(obj: any, prefix = ""): string[] {
  const keys: string[] = []

  Object.entries(obj).forEach(([key, value]) => {
    const newPrefix = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === "object") {
      keys.push(...getTranslationKeys(value, newPrefix))
    } else {
      keys.push(newPrefix)
    }
  })

  return keys.sort()
}

describe("translation schema validation", () => {
  test("en.json should have all keys defined in schema", () => {
    const enPath = path.join(translationsDir, "en.json")
    const enTranslations = JSON.parse(fs.readFileSync(enPath, "utf-8"))

    const schemaKeys = getRequiredKeysFromSchema(schema)
    const translationKeys = getTranslationKeys(enTranslations)

    const missingInTranslations = schemaKeys.filter(
      (key) => !translationKeys.includes(key)
    )
    const extraInTranslations = translationKeys.filter(
      (key) => !schemaKeys.includes(key)
    )

    if (missingInTranslations.length > 0) {
      console.error("\nMissing keys in en.json:", missingInTranslations)
    }

    if (extraInTranslations.length > 0) {
      console.error("\nExtra keys in en.json:", extraInTranslations)
    }

    expect(missingInTranslations).toEqual([])
    expect(extraInTranslations).toEqual([])
  })
})
