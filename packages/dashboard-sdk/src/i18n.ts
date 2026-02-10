import fs from "fs"
import path from "path"
import { VALID_FILE_EXTENSIONS } from "./constants"
import { normalizePath } from "./utils"
import type { BuiltMercurConfig } from "./types"

function findI18nIndex(srcDir: string): string | null {
    const i18nDir = path.join(srcDir, "i18n")

    if (!fs.existsSync(i18nDir)) {
        return null
    }

    for (const ext of VALID_FILE_EXTENSIONS) {
        const filePath = path.join(i18nDir, `index${ext}`)
        if (fs.existsSync(filePath)) {
            return filePath
        }
    }

    return null
}

export function generateI18n({ srcDir }: BuiltMercurConfig): string {
    const indexFile = findI18nIndex(srcDir)

    if (!indexFile) {
        return `export default {}`
    }

    const importPath = normalizePath(indexFile)

    return `import i18nResources from "${importPath}"
export default i18nResources`
}
