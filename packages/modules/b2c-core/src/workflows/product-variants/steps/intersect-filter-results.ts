import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

export const intersectFilterResultsStep = createStep(
  "intersect-filter-results",
  async (input: {
    filterResults: Array<{ variantIds: string[] } | undefined>;
  }) => {
    const validResults = input.filterResults.filter(
      (result): result is { variantIds: string[] } => result !== undefined
    );

    if (validResults.length === 0) {
      return new StepResponse<{ finalVariantIds: string[] | null }>({
        finalVariantIds: null,
      });
    }

    let intersection: string[] | null = null;

    for (const result of validResults) {
      if (intersection === null) {
        intersection = [...result.variantIds];
      } else {
        intersection = intersection.filter((id) =>
          result.variantIds.includes(id)
        );
      }

      if (intersection.length === 0) {
        break;
      }
    }

    return new StepResponse<{ finalVariantIds: string[] | null }>({
      finalVariantIds: intersection || [],
    });
  }
);
