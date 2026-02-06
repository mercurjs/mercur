const Ajv = require("ajv")
const fs = require("fs")
const path = require("path")
const schema = require("../../src/i18n/translations/$schema.json")

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema)

// Get file name from command line arguments
const fileName = process.argv[2]

if (!fileName) {
  console.error("Please provide a file name (e.g., en.json) as an argument.")
  process.exit(1)
}

const filePath = path.join(__dirname, "../../src/i18n/translations", fileName)

try {
  const translations = JSON.parse(fs.readFileSync(filePath, "utf-8"))

  if (!validate(translations)) {
    console.error(`\nValidation failed for ${fileName}:`)
    validate.errors?.forEach((error) => {
      if (error.keyword === "required") {
        const missingKeys = error.params.missingProperty
        console.error(
          `  Missing required key: "${missingKeys}" at ${error.instancePath}`
        )
      } else if (error.keyword === "additionalProperties") {
        const extraKey = error.params.additionalProperty
        console.error(
          `  Unexpected key: "${extraKey}" at ${error.instancePath}`
        )
      } else {
        console.error(`  Error: ${error.message} at ${error.instancePath}`)
      }
    })
    process.exit(1)
  } else {
    console.log(`${fileName} matches the schema.`)
    process.exit(0)
  }
} catch (error) {
  console.error(`Error reading or parsing file: ${error.message}`)
  process.exit(1)
}
