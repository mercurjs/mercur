import { describe, expect, test } from "vitest"

import { languages } from "../languages"
import translations from "../translations"

describe("languages", () => {
  test.each(languages.map((l) => l.code))(
    "%s is a valid BCP 47 language tag",
    (code) => {
      expect(() => new Intl.DateTimeFormat(code)).not.toThrow()
      expect(() => Intl.getCanonicalLocales(code)).not.toThrow()
    }
  )

  test.each(languages.map((l) => l.code))(
    "%s has translation resources",
    (code) => {
      expect(translations[code]).toBeDefined()
    }
  )
})
