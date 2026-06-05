export const mockGetStats = jest.fn().mockResolvedValue({ numberOfDocuments: 42 })
export const mockSearchFn = jest.fn()
export const mockAddDocuments = jest.fn().mockResolvedValue({})
export const mockDeleteDocuments = jest.fn().mockResolvedValue({})
export const mockUpdateSettings = jest.fn().mockResolvedValue({})

export const mockIndexFn = jest.fn().mockReturnValue({
  search: mockSearchFn,
  addDocuments: mockAddDocuments,
  deleteDocuments: mockDeleteDocuments,
  getStats: mockGetStats,
  updateSettings: mockUpdateSettings,
})

jest.mock("meilisearch", () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: mockIndexFn,
    config: { host: "http://localhost:7700" },
  })),
}))
