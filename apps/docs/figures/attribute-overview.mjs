export default {
  name: "attribute-overview",
  width: 1040,
  height: 640,
  alt: "The global attribute catalog lists Size, Material, Thread count, Gift wrap, and Care with their types, and Size is the one variant axis, backed by the global Medusa product option Size behind it.",
  draw(f) {
    f.tiles({ seed: 7 })
    f.cascade({ x: 40, y: 150, w: 900, h: 451 }, [
      (p) => {
        p.header({
          marker: "mid",
          title: "Product options",
          tabs: ["Global", "Exclusive"],
          note: "opt",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Title", w: 300 },
            { label: "Values", w: 300 },
            { label: "is_exclusive", w: 236, align: "right" },
          ],
          rows: [
            ["Size", "S, M, L", { text: "false", tone: "mid" }],
          ],
        })
      },
      (p) => {
        p.header({
          marker: "violet",
          title: "Attributes",
          tabs: ["Global", "Inline"],
          note: "pattr",
        })
        p.table({
          y: 76,
          columns: [
            { label: "Name", w: 200 },
            { label: "Type", w: 190 },
            { label: "Axis", w: 110 },
            { label: "Filterable", w: 140 },
            { label: "Values", w: 196, align: "right" },
          ],
          rows: [
            {
              accent: true,
              cells: [
                "Size",
                "multi_select",
                { toggle: true },
                { toggle: true },
                "S, M, L",
              ],
            },
            [
              "Material",
              { text: "single_select", tone: "text" },
              { toggle: false },
              { toggle: true },
              { text: "Cotton, Linen", tone: "mid" },
            ],
            [
              "Thread count",
              { text: "unit", tone: "text" },
              { toggle: false },
              { toggle: false },
              "",
            ],
            [
              "Gift wrap",
              { text: "toggle", tone: "text" },
              { toggle: false },
              { toggle: false },
              { text: "true, false", tone: "mid" },
            ],
            [
              "Care",
              { text: "text", tone: "text" },
              { toggle: false },
              { toggle: false },
              "",
            ],
          ],
        })
      },
    ])
  },
}
