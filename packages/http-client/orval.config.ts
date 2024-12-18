export default {
  vendor: {
    output: {
      target: "codegen/index.ts",
      schemas: "codegen/types",
      client: "fetch",
      baseUrl: "http://localhost:9000",
      mock: false,
      override: {
        mutator: {
          path: "./src/index.ts",
          name: "customFetch",
        },
      },
    },
    input: {
      target: "../../apps/backend/combined.oas.json",
    },
  },
};
