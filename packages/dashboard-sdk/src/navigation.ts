import fs from "fs"
import path from "path"
import { VALID_FILE_EXTENSIONS } from "./constants"
import { normalizePath } from "./utils"
import type { BuiltMercurConfig } from "./types"

/**
 * Navigation overrides are a single host-owned file `src/_navigation.ts`,
 * discovered like `src/i18n/index.*` (one file, not a folder crawl). Installed
 * blocks cannot contribute nav overrides — the sidebar order/visibility is a
 * deliberate host-only single source of truth, so there is no plugin-entry slot.
 */
function findNavigationFile(srcDir: string): string | null {
    for (const ext of VALID_FILE_EXTENSIONS) {
        const filePath = path.join(srcDir, `_navigation${ext}`)
        if (fs.existsSync(filePath)) return filePath
    }
    return null
}

export function generateNavigation({ srcDir }: BuiltMercurConfig): string {
    const file = findNavigationFile(srcDir)

    if (!file) {
        return `export default { items: [] }`
    }

    return `import navigationConfig from "${normalizePath(file)}"
export default navigationConfig`
}
