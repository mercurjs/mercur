export default {
  name: "catalog-status-lifecycle",
  width: 1040,
  height: 540,
  alt: "A Status transitions table: createProductsWorkflow creates a product as proposed, then confirmProductsWorkflow, rejectProductWorkflow, and requestProductChangeWorkflow move it to published, to rejected, or keep it proposed, with a product_change audit table behind.",
  draw(f) {
    f.tiles({ seed: 19 })
    f.cascade({ x: 40, y: 120, w: 920, h: 392 }, [
      (p) => {
        p.header({ marker: "hi", title: "product_change", tabs: ["Audit"], note: "STATUS_CHANGE" })
        p.table({
          y: 76,
          columns: [
            { label: "Action", w: 400 },
            { label: "Created by", w: 456, align: "right" },
          ],
          rows: [
            ["PRODUCT_ADD", "sel_01JD8Q1234567"],
            ["STATUS_CHANGE", "user_01JD8Q1234568"],
          ],
        })
      },
      (p) => {
        p.header({ marker: "violet", title: "Status transitions", tabs: ["Product"], note: "ProductStatus" })
        p.table({
          y: 76,
          columns: [
            { label: "From", w: 170 },
            { label: "To", w: 170 },
            { label: "Workflow", w: 516 },
          ],
          rows: [
            [{ text: "new", tone: "mid" }, { chip: "Proposed", tone: "amber" }, "createProductsWorkflow"],
            {
              accent: true,
              cells: [{ chip: "Proposed", tone: "amber" }, { chip: "Published", tone: "green" }, "confirmProductsWorkflow"],
            },
            [{ chip: "Proposed", tone: "amber" }, { chip: "Rejected", tone: "red" }, "rejectProductWorkflow"],
            [{ chip: "Proposed", tone: "amber" }, { chip: "Proposed", tone: "amber" }, "requestProductChangeWorkflow"],
          ],
        })
      },
    ])
  },
}
