describe("workflow definitions", () => {
  it("give every when-then block that returns a value a stable name", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {})

    await import("..")
    await new Promise((resolve) => setImmediate(resolve))

    const unnamed = warn.mock.calls
      .map((args) => args.map(String).join(" "))
      .filter((message) => message.includes('"when" name should be defined'))

    warn.mockRestore()

    expect(unnamed).toEqual([])
  })
})
