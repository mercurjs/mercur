# UI Icons — Mercur.js

## Rule

**This project uses ONLY `@medusajs/icons`.** Do not install or import icons from any other library (`lucide-react`, `react-icons`, `heroicons`, `phosphor`, Material Icons, inline SVGs from random sources, etc.). If an icon you need does not exist in `@medusajs/icons`, pick the closest match from the list below — do not add a new dependency, and do not hand-roll an SVG component.

Official reference: <https://docs.medusajs.com/ui/icons/overview>

## Usage

```tsx
import { Plus, Trash, MagnifyingGlass } from "@medusajs/icons"

<Plus />
<Trash className="text-ui-fg-subtle" />
<MagnifyingGlass />
```

All icons are React components. They accept standard SVG props (`className`, `width`, `height`, `color`, `onClick`, etc.). Default size is 16x16. Use Tailwind/Medusa UI color tokens (`text-ui-fg-base`, `text-ui-fg-subtle`, `text-ui-fg-muted`, `text-ui-tag-red-icon`, etc.) for color — do not pass hex codes.

Variants you'll see in the list below:
- `Solid` — filled version of the same glyph (e.g. `Heart` vs `HeartSolid`). Use solid for "active/selected" states.
- `Mini` — 12x12 micro variant for dense UI (badges, inline status, tight tables).
- `Micro` — even smaller, for inline-with-text use.
- `Ex` — colored/branded variant of brand logos (e.g. `Typescript` mono vs `TypescriptEx` colored).

---

## Icon Catalogue

### Navigation & Arrows
- `ArrowDown`, `ArrowLeft`, `ArrowRight`, `ArrowDownLeft`, `ArrowRightDown` — directional arrows for navigation, sort indicators, links.
- `ArrowDownMini`, `ArrowLeftMini`, `ArrowRightMini`, `ArrowUpMini`, `ArrowDownLeftMini`, `ArrowDownRightMini`, `ArrowUpRightMini`, `ArrowUpRightMicro` — small directional arrows for inline use.
- `ArrowLongDown`, `ArrowLongLeft`, `ArrowLongRight`, `ArrowLongUp` — long-shaft arrows; emphasize direction over compactness.
- `ArrowDownCircle`, `ArrowUpCircleSolid`, `CircleArrowUp` — arrow inside a circle; "scroll-to-top", "promote", "upload".
- `ArrowDownTray`, `ArrowUpTray` — download / upload to a tray. Use for "Download" and "Upload" buttons.
- `ArrowPath`, `ArrowPathMini` — circular refresh arrow; "Reload", "Sync", "Retry".
- `ArrowRightOnRectangle` — arrow into a box; "Log out", "Exit".
- `ArrowTurnUp` — return / reply arrow.
- `ArrowUpDown` — vertical bidirectional; sort indicator.
- `ArrowUpRightOnBox` — open in new tab / external link.
- `ArrowUturnLeft` — undo / back.
- `ArrowsPointingOut`, `ArrowsPointingOutMini` — expand to fullscreen.
- `ArrowsReduceDiagonal`, `Reduce` — contract / minimize.
- `BackwardSolid`, `ForwardSolid` — media skip back / forward.
- `BottomToTop`, `TopToBottom` — reorder direction.
- `Collapse`, `Expand`, `Unfold` — section toggles.
- `CaretMaximizeDiagonal`, `CaretMinimizeDiagonal` — diagonal arrow caret; window / panel maximize.
- `ChevronDown`, `ChevronLeft`, `ChevronRight`, `ChevronUpDown` — chevrons for dropdowns, accordions, breadcrumbs, sort.
- `ChevronDownMini`, `ChevronLeftMini`, `ChevronRightMini`, `ChevronUpMini` — small chevrons for tight UI.
- `ChevronDoubleLeft`, `ChevronDoubleRight`, `ChevronDoubleLeftMiniSolid`, `ChevronDoubleRightMiniSolid` — double chevrons; "first page", "last page", pagination jumps.
- `TriangleDownMini`, `TriangleLeftMini`, `TriangleRightMini`, `TriangleRightMiniHover`, `TriangleUpMini`, `TrianglesMini` — solid triangles; sort headers, expand state.
- `Directions` — turn-by-turn / location direction.
- `Pointer`, `PointerCircleSolid`, `CursorArrowRays`, `CursorDefault`, `CursorDefaultSolid` — cursor / click affordances.

### Actions (CRUD & generic)
- `Plus`, `PlusMini`, `CirclePlus`, `SquaresPlus`, `SquaresPlusSolid` — add / create. Use `Plus` for buttons, `CirclePlus` for empty states.
- `Minus`, `MinusMini`, `MinusCircle`, `MinusBadge`, `CircleMinusSolid` — remove / decrement.
- `Trash` — delete (destructive). Always pair with confirmation.
- `Pencil`, `PencilSquare`, `PencilSquareSolid`, `TablePen`, `PenPlus`, `Rename` — edit / rename.
- `FloppyDisk` — save.
- `XMark`, `XMarkMini`, `X` — close / dismiss / clear.
- `XCircle`, `XCircleSolid`, `CircleXmarkSolid` — close in a circle; cancel an item.
- `Check`, `CheckMini`, `CheckCircle`, `CheckCircleSolid`, `CheckCircleMiniSolid`, `CircleCheckSolid`, `BadgeCheck`, `VerifiedBadge` — confirmation, success, validated.
- `CloneDashed`, `SquareTwoStack`, `SquareTwoStackMini`, `SquareTwoStackSolid` — duplicate / copy.
- `Share` — share / export externally.
- `Resend` — resend (email, invite).
- `Snooze` — postpone / silence.
- `Scan`, `ScanText` — scan a barcode / OCR.
- `Focus` — focus on / zoom to.
- `Resize` — resize handle.

### Status & Feedback
- `CircleInfoSolid`, `InformationCircle`, `InformationCircleSolid` — informational.
- `CircleWarningSolid`, `ExclamationCircle`, `ExclamationCircleSolid` — warning / error.
- `CheckCircle`, `CheckCircleSolid`, `CircleCheckSolid` — success.
- `QuestionMark`, `QuestionMarkCircle` — help / unknown.
- `BellAlert`, `BellAlertDone`, `BellAlertSolid` — notifications.
- `Loader`, `Spinner` — loading state.
- `CircleHalfDottedClock` — in progress / partially complete.
- `Progress0`, `Progress15`, `Progress30`, `Progress45`, `Progress60`, `Progress75`, `Progress90`, `Progress100` — discrete progress glyphs (use for status pills/timelines).
- `MagnifierAlert` — search returned an issue / no results.
- `WIP` — work in progress.

### Geometric / Status Dots & Tag Glyphs
- `EllipseSolid`, `EllipseMiniSolid` — generic status dot.
- `EllipseBlueSolid`, `EllipseGreenSolid`, `EllipseGreySolid`, `EllipseOrangeSolid`, `EllipsePurpleSolid`, `EllipseRedSolid` — colored status dots for tag/badge rows.
- `SquareBlueSolid`, `SquareGreenSolid`, `SquareGreySolid`, `SquareOrangeSolid`, `SquarePurpleSolid`, `SquareRedSolid` — colored status squares.
- `CircleSolid`, `CircleMiniSolid`, `CircleMiniFilledSolid`, `CircleFilledSolid` — filled circle for selected/active.
- `CircleDottedLine` — empty/placeholder ring.
- `CircleQuarterSolid`, `CircleHalfSolid`, `CircleThreeQuartersSolid` — partial fills; capacity / quota.
- `CircleStack`, `CircleStackSolid` — database / stacked records.
- `CircleSliders` — settings / filter circle.
- `SquareDashedCursor` — selection rectangle / drag target.
- `StackPerspective`, `Layers3` — layered objects.
- `DotsSix`, `EllipsisHorizontal`, `EllipsisVertical` — drag handle / "more" menu.

### Search, Filter, Sort
- `MagnifyingGlass`, `MagnifyingGlassMini` — search input, search button.
- `Funnel`, `FunnelPlus` — filter; `FunnelPlus` for "add a filter".
- `Adjustments`, `AdjustmentsDone` — filter/settings panel; `AdjustmentsDone` indicates filters are applied.
- `BarsArrowDown`, `DescendingSorting` — sort.
- `BarsThree` — hamburger menu.
- `Telescope`, `TelescopeSolid` — discover / explore.

### Layout & View
- `GridLayout`, `GridList`, `ListBullet`, `ListCheckbox`, `ListTree`, `QueueList`, `QueueSolid` — list / grid view toggles.
- `LayoutBottom`, `LayoutLeft`, `LayoutLeftRight`, `LayoutRight`, `LayoutTop`, `LayoutTopBottom` — layout/split orientation.
- `SidebarLeft`, `SidebarLeftFilled`, `SidebarRight`, `SidebarRightFilled` — collapse/expand sidebar.
- `MarginBottom`, `MarginLeft`, `MarginLeftRight`, `MarginRight`, `MarginTop`, `MarginTopBottom`, `Gap` — spacing controls (form/editor UI).
- `Component`, `ComponentSolid` — reusable component / block.
- `Puzzle`, `PuzzleSolid` — extension / plugin.
- `Window` — windowed view.
- `TimelineVertical` — timeline / activity history.
- `Levels` — depth / hierarchy.

### Commerce — Catalog, Orders, Fulfillment
- `Tag`, `TagSolid`, `TagIllustration` — product tag, label, price.
- `Shopping`, `ShoppingBag`, `ShoppingCart`, `ShoppingCartSolid` — cart, shop.
- `BuildingStorefront` — storefront / store.
- `Receipt`, `ReceiptPercent` — invoice / discount receipt.
- `CreditCard`, `CreditCardSolid`, `CreditCardRefresh` — payment method.
- `Cash`, `CashSolid` — cash payment, payout.
- `CurrencyDollar`, `CurrencyDollarSolid` — money / price.
- `Gift`, `GiftSolid`, `GiftCards` — gift card.
- `StoreCredits` — store credit.
- `WishLists`, `Heart`, `HeartBroken` — wishlist / favorite.
- `DraftOrders` — draft order.
- `ArchiveBox` — archive / stored items.
- `FlyingBox` — shipment in transit.
- `HandTruck` — fulfillment / shipping operation.
- `TruckFast` — express shipping.
- `TaxExclusive`, `TaxInclusive`, `BuildingTax` — tax indicators / tax region.
- `ReceiptPercent`, `Percent` — discount.
- `Channels`, `ChannelsSolid` — sales channels.
- `Swatch`, `SwatchSolid` — variant / color option.
- `ThumbnailBadge`, `FeaturedBadge`, `Bloom`, `BloomBadge` — featured / highlighted item.

### Users & Sellers
- `User`, `UserMini` — single user / customer.
- `Users`, `UsersSolid`, `UserGroup` — customer groups, team.
- `IdBadge` — account / member identity.
- `MemberBronzeBadge`, `MemberSilverBadge`, `MemberGoldBadge` — membership tier.
- `AcademicCap`, `AcademicCapSolid` — student / learning role.

### Communication
- `Envelope`, `EnvelopeSolid`, `EnvelopeContent` — email.
- `ChatBubble`, `ChatBubbleLeftRight`, `ChatBubbleLeftRightSolid`, `MessagePlus` — chat / message / new conversation.
- `Phone` — phone contact.
- `Mailbox` — inbox.
- `InboxSolid` — inbox (filled).
- `PaperPlane` — send.
- `PaperClip` — attachment.
- `AtSymbol` — mention / email handle.
- `Megaphone` — campaign / announcement (use `RocketLaunch` if not present).
- `Rss` — feed / subscription.

### Files & Media
- `File`, `FilePlus` — file / new file.
- `Folder`, `FolderOpen`, `FolderIllustration`, `FolderOpenIllustration` — folder / directory.
- `DocumentText`, `DocumentTextSolid`, `DocumentSeries`, `ScrollText` — document, multi-document.
- `Photo`, `PhotoSolid`, `Image`, `Images`, `ImageSparkle` — image, gallery, AI-enhanced image.
- `Camera` — capture.
- `Palette` — design / theming.
- `Typography`, `Text`, `TextHighlight`, `DropCap`, `MarkdownSolid` — text formatting.
- `Brackets`, `Code`, `CommandLine`, `CommandLineSolid`, `CodeEditor` — code blocks, terminal.
- `CodeBranch`, `CodeCommit`, `CodeCompare`, `CodeMerge`, `CodePullRequest` — Git / version control.
- `CloudArrowDown`, `CloudArrowUp`, `CloudSolid` — cloud download / upload / storage.
- `Server`, `ServerSolid`, `ServerStack`, `ServerStackSolid` — infrastructure / hosting.
- `Microchip` — hardware / firmware.

### Settings & System
- `CogSixTooth`, `CogSixToothSolid` — settings.
- `Wrench`, `Tools`, `ToolsSolid` — maintenance / configuration.
- `Key`, `KeySolid` — API key, credential.
- `LockClosedSolid`, `LockClosedSolidMini`, `LockOpenSolid` — locked / unlocked state, permission.
- `ShieldCheck` — security / verified.
- `Plug` — integration / connection.
- `Variable` — variable / dynamic value.
- `Bug`, `BugAntSolid` — bug / issue.
- `Beaker` — experimental / lab feature.
- `Bolt`, `BoltSolid` — quick action / power.
- `Robot` — automation / bot / AI.
- `AiAssistent`, `AiAssistentLuminosity`, `Sparkles`, `SparklesMini`, `SparklesMiniSolid`, `SparklesSolid`, `Sparkle2Solid`, `WandSparkle`, `BroomSparkle`, `BroomSparkleSolid`, `CardSparkle`, `GaugeSparkle` — AI / magic / auto-generated.
- `ChartActivity`, `ChartBar`, `ChartPie` — analytics, reporting.
- `GaugeSparkle` — performance indicator.
- `Stopwatch`, `Clock`, `ClockSolid`, `ClockSolidMini`, `ClockChangedSolidMini`, `History` — time / scheduled / history.
- `Calendar`, `CalendarMini`, `CalendarSolid` — date picker, schedule.
- `DecisionProcess` — workflow / branching logic.

### Misc UI
- `Star`, `StarSolid` — rating / favorite.
- `Bookmarks` — saved.
- `PinTack`, `PinTackSolid` — pin / pinned.
- `Trophy` — achievement.
- `LightBulb`, `LightBulbSolid` — tip / idea.
- `Lifebuoy` — help / support.
- `Fire`, `FireSolid` — trending / hot.
- `Eye`, `EyeMini`, `EyeSlash`, `EyeSlashMini` — show / hide (passwords, columns).
- `Glasses` — read / review.
- `RocketLaunch`, `RocketLaunchSolid` — launch / deploy / go live.
- `Party` — celebration / completed onboarding.
- `Target` — goal / objective.
- `Equals`, `Hashtag` — operators / counts.
- `Book`, `BookOpen` — documentation / guide.
- `Newspaper` — news / changelog.
- `OpenRectArrowOut` — external link / open out.
- `Link` — hyperlink.
- `MapPin`, `Map`, `Globe`, `GlobeEurope`, `GlobeEuropeSolid` — location, region, world.
- `House`, `HouseStar` — home / favorite home.
- `Buildings`, `BuildingsMini`, `BuildingsSolid` — companies, business.
- `Language` — i18n / locale.
- `Keyboard` — keyboard shortcut.
- `LaptopMobile`, `ComputerDesktop`, `ComputerDesktopSolid`, `Tablet` — device.
- `Moon`, `MoonSolid`, `Sun`, `SunSolid` — dark / light mode.
- `FaceSmile`, `FaceDisappointed`, `FaceCrossedOutEyes`, `GhostWorried` — emoji-ish reactions / empty states.
- `ThumbUp`, `ThumbDown` — vote / feedback.
- `ChefHat` — recipe / template (rare; use `Component` if unsure).
- `Button` — button primitive (design system docs).
- `MediaPlay`, `MediaStopSolid`, `PlayMiniSolid`, `PlaySolid`, `PauseSolid`, `Pause`, `StopCircleSolid`, `ReplaySolid` — media controls.

### Inventory & Warehouse
- `CubeSolid` — single product / inventory unit.
- `BuildingStorefront` — storefront.
- `ArchiveBox` — archived stock.
- `Buildings` — multi-location.

### Brand / Integration Logos
- `Amazon`, `Apple`, `Astro`, `Contentful`, `Discord`, `Facebook`, `Figma`, `Gatsby`, `GatsbyEx`, `Github`, `Google`, `Javascript`, `JavascriptEx`, `Klarna`, `KlarnaEx`, `Klaviyo`, `Linear`, `Linkedin`, `Mastercard`, `Medusa`, `Meilisearch`, `Meta`, `NextJs`, `Paypal`, `Payphone`, `ReactJs`, `ReactJsEx`, `Sanity`, `Sap`, `Sendgrid`, `Shipbob`, `Shippo`, `Slack`, `Stripe`, `Svelte`, `Tailwind`, `Tanstack`, `Telegram`, `Typescript`, `TypescriptEx`, `Vercel`, `Visa`, `Vite`, `Webshipper`, `X` — use for integration cards, OAuth buttons, payment method indicators. Prefer the `Ex` variant when you want the brand's official color, otherwise the plain version inherits `currentColor`.

---

## Picking an Icon (Heuristics for Agents)

1. **Match the action, not the noun.** "Delete a seller" → `Trash`, not `User`.
2. **Solid = active/selected, outline = default.** Don't mix arbitrarily inside the same row.
3. **Use `Mini`/`Micro` variants only inside dense UI** (tables, inline labels, badges). Default size for buttons and menus.
4. **Status semantics are fixed.** Green/check for success, red/x for error, amber for warning, blue for info. Match the icon to the status color token, not the icon's own color.
5. **Brand logos: use the exact provided component.** Never re-import a brand SVG from another library.
6. **If nothing fits well, use a neutral one** (`Component`, `Tag`, `Cube`, `CircleSliders`) rather than installing a new icon library.

## Don't

- Don't `npm i lucide-react` / `react-icons` / `@heroicons/react`. The repo's lint and review will reject it.
- Don't inline raw `<svg>` markup unless you're rendering user-uploaded content.
- Don't override icon size with hardcoded `width="24"` — use Tailwind size classes (`size-4`, `size-5`) or wrap in a sized container.
- Don't pass hex colors. Use `text-ui-fg-*` and `text-ui-tag-*-icon` tokens.
