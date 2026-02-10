# Skill: Routing Troubleshooting

Common issues and solutions for file-based routing.

## Usage

```
/troubleshooting [issue]
```

---

## Issue: Page shows 404

**Cause:** Missing `export const Component`

**Solution:**
```tsx
// Every page MUST export Component
export const Component = () => <div>Content</div>
```

---

## Issue: Settings page shows nested sidebars

**Cause:** Settings route not under `src/pages/settings/`

**Solution:**
Move settings pages to `src/pages/settings/`:
```
WRONG: src/pages/regions/        → /regions (main layout)
RIGHT: src/pages/settings/regions/ → /settings/regions (settings layout)
```

---

## Issue: Breadcrumb not showing

**Cause:** Missing `Breadcrumb` export

**Solution:**
```tsx
// pages/vendors/[id]/index.tsx
export const Component = VendorDetail
export { loader } from "./loader"
export { VendorBreadcrumb as Breadcrumb } from "./breadcrumb"
```

---

## Issue: Loader not running

**Cause:** Loader not exported correctly

**Solution:**
```tsx
// Export the loader function directly
export const loader = async ({ params }) => {
  return fetchData(params.id)
}

// OR re-export from separate file
export { vendorLoader as loader } from "./loader"
```

---

## Issue: Import not found (@pages/...)

**Cause:** Old import path after moving folder

**Solution:**
Update imports to new path:
```tsx
// WRONG (old path)
import { ... } from "@pages/regions/..."

// RIGHT (after moving to settings)
import { ... } from "@pages/settings/regions/..."
```

---

## Issue: Dynamic route not matching

**Cause:** Folder not using bracket syntax

**Solution:**
```
WRONG: src/pages/products/id/
RIGHT: src/pages/products/[id]/
```

---

## Issue: Modal not closing on navigation

**Cause:** Using wrong modal component

**Solution:**
```tsx
// For create pages (full-screen modal)
import { RouteFocusModal } from "@components/modals"

// For edit pages (side drawer)
import { RouteDrawer } from "@components/modals"
```

---

## Issue: Public route requires auth

**Cause:** Route path not in PUBLIC_PATHS

**Solution:**
Public paths are defined in `route-builder.ts`:
```tsx
const PUBLIC_PATHS = ["/login", "/invite", "/reset-password"]
```

Add new public paths there or use route groups (future feature).

---

## Issue: Build passes but Vite dev fails

**Cause:** tsup (build) vs Vite resolve imports differently

**Solution:**
1. Use aliases (`@components/`) not relative paths
2. Check for broken relative imports (`../../../`)
3. Make sure all moved files have updated imports

---

## Checklist: New Page

1. [ ] Created `index.tsx` with `export const Component`
2. [ ] Used correct folder location (main vs settings)
3. [ ] Added loader if page needs data
4. [ ] Added Breadcrumb if dynamic route
5. [ ] Used aliases for imports
6. [ ] Tested in dev server

---

## Checklist: Moving a Page

1. [ ] Moved folder to new location
2. [ ] Updated all `@pages/` imports to new path
3. [ ] Updated relative imports within the folder
4. [ ] Ran build to verify
5. [ ] Tested in dev server
