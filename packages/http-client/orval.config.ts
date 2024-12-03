export default {
  vendor: {
    output: {
      target: "codegen/index.ts",
      schemas: "codegen/models",
      client: "fetch",
      baseUrl: "http://localhost:3000",
      mock: false,
    },
    input: {
      target: "../../apps/backend/combined.oas.json",
    },
  },
};
