import { Fragment, createElement } from "react"
import { describe, expect, test } from "vitest"
import { ExtensionRegistry } from "../extensions/registry"
import {
  applyReplacements,
  buildCoreEntries,
  buildDisplayEntries,
  buildWidgetEntries,
  extractSectionElements,
} from "./entries"
import { LayoutEntry } from "./entry"

const General = () => null
const Media = () => null
const Widget = () => null

const sections = () =>
  extractSectionElements({
    main: createElement(
      Fragment,
      null,
      createElement(LayoutEntry, { id: "ProductGeneralSection" }, createElement(General)),
      createElement(Media)
    ),
    side: createElement(LayoutEntry, { id: "ProductOrganizationSection" }, null),
  })

describe("layout composer entries", () => {
  test("core entries take the Entry id, else the component name", () => {
    const elements = extractSectionElements({
      main: [
        createElement(LayoutEntry, { id: "ProductGeneralSection", key: "a" }, null),
        createElement(Media, { key: "b" }),
        createElement(Media, { key: "c" }),
      ],
    })
    expect(buildCoreEntries(elements).map((e) => [e.entryId, e.naturalSection])).toEqual([
      ["core:ProductGeneralSection", "main"],
      ["core:Media", "main"],
      ["core:Media#2", "main"],
    ])
  })

  test("a replacing widget takes the slot and gets renderDefault", () => {
    const elements = extractSectionElements({
      main: [
        createElement(LayoutEntry, { id: "ProductGeneralSection", key: "a" }, createElement(General)),
        createElement(Media, { key: "b" }),
      ],
    })
    const core = buildCoreEntries(elements)
    const widgets = buildWidgetEntries({
      main: [
        { Component: Widget, widgetId: "widget:seller", replace: "core:ProductGeneralSection" },
        { Component: Widget, widgetId: "widget:missing", replace: "core:Nope" },
      ],
    })

    const result = applyReplacements(core, widgets)
    expect(result.map((e) => e.entryId)).toEqual(["widget:seller", "core:Media", "widget:missing"])

    const rendered = result[0].render({ id: "p" }) as { props: { renderDefault: () => unknown } }
    const fallback = rendered.props.renderDefault() as { type: unknown }
    expect(fallback.type).toBe(LayoutEntry)
  })

  test("preferences hide, reorder and move entries; unknown sections fall back", () => {
    const core = buildCoreEntries(sections())
    const widgets = buildWidgetEntries({
      side: [{ Component: Widget, widgetId: "widget:kpi", order: -1 }],
    })
    const valid = new Set(["main", "side"])

    const result = buildDisplayEntries(
      [...core, ...widgets],
      {
        entries: {
          "core:Media": { hidden: true },
          "core:ProductOrganizationSection": { section: "main", order: -5 },
          "widget:kpi": { section: "nowhere" },
        },
      },
      valid
    )

    expect(result.main.map((e) => [e.entryId, e.order, e.hidden])).toEqual([
      ["core:ProductOrganizationSection", -5, false],
      ["core:ProductGeneralSection", 0, false],
      ["core:Media", 0, true],
    ])
    expect(result.side.map((e) => e.entryId)).toEqual(["widget:kpi"])
  })

  test("registry resolves widgets per section with legacy suffixes", () => {
    const registry = new ExtensionRegistry({
      widgets: {
        widgets: [
          { Component: Widget, zone: ["product.detail.side.before"], widgetId: "a" },
          { Component: Widget, zone: ["product.detail"], widgetId: "b", section: "side", order: 3 },
          { Component: Widget, zone: ["product.detail.main.after"], widgetId: "c" },
          { Component: Widget, zone: ["product.details"], widgetId: "other" },
          { Component: Widget, zone: ["product.detail.tabs"], widgetId: "tab" },
        ],
      },
    })

    const result = registry.getWidgetsForSections("product.detail", ["main", "side"])
    expect(result.side.map((w) => [w.widgetId, w.order])).toEqual([
      ["widget:a", Number.NEGATIVE_INFINITY],
      ["widget:b", 3],
    ])
    expect(result.main.map((w) => [w.widgetId, w.order])).toEqual([
      ["widget:c", Number.POSITIVE_INFINITY],
    ])
  })

  test("registry merges preferences across layers and derives nav overrides", () => {
    const Icon = () => null
    const registry = new ExtensionRegistry({
      navigation: { items: [{ id: "payouts", rank: 9 }], groups: [] },
      preferences: {
        layers: [
          {
            "product.detail": { entries: { "core:Media": { hidden: true, order: 2 } } },
            "nav.main": {
              groups: [{ id: "finance", label: "Finance" }],
              entries: { "nav:/payouts": { section: "finance", hidden: true } },
            },
          },
          {
            "product.detail": { entries: { "core:Media": { hidden: false } } },
            "nav.main": { entries: { "nav:/products": { label: "Catalog", icon: Icon, parent: null, order: -1 } } },
          },
        ],
      },
    })

    expect(registry.getLayoutPreference("product.detail")).toEqual({
      entries: { "core:Media": { hidden: false, order: 2 } },
    })
    expect(registry.getNavGroups()).toEqual([{ id: "finance", label: "Finance" }])
    expect(registry.getNavOverrides()).toEqual([
      { id: "payouts", rank: 9, group: "finance", hidden: true },
      { id: "products", label: "Catalog", icon: Icon, nested: null, rank: -1 },
    ])
  })
})
