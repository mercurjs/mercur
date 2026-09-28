/**
 * Applied to anything in the sidebar that has no place in the icon rail —
 * labels, the store name, the shortcut hint. Expanding waits for the rail to
 * make room before fading the content back in; collapsing clears it first so
 * it is never caught mid-fade by the clip.
 */
export const SIDEBAR_RAIL_FADE = [
  "transition-opacity duration-150 delay-100 ease-out motion-reduce:transition-none",
  "group-data-[state=collapsed]/sidebar:opacity-0",
  "group-data-[state=collapsed]/sidebar:delay-0 group-data-[state=collapsed]/sidebar:duration-75",
].join(" ")

/**
 * Sidebar dropdowns take the trigger's width, which in the icon rail is only
 * the avatar — the floor keeps them readable when opened from the rail.
 */
export const SIDEBAR_MENU_CONTENT =
  "w-[var(--radix-dropdown-menu-trigger-width)] min-w-[196px]"
