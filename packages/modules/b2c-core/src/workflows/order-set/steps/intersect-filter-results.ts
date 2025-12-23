import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

export const intersectFilterResultsStep = createStep(
  "intersect-filter-results",
  async (input: {
    filterResults: Array<{ orderSetIds: string[] } | undefined>;
  }) => {
    const validResults = input.filterResults.filter(
      (result): result is { orderSetIds: string[] } => result !== undefined
    );

    if (validResults.length === 0) {
      return new StepResponse<{ finalOrderSetIds: string[] | null }>({
        finalOrderSetIds: null,
      });
    }

    let intersection: string[] | null = null;

    for (const result of validResults) {
      if (intersection === null) {
        intersection = [...result.orderSetIds];
      } else {
        intersection = intersection.filter((id) =>
          result.orderSetIds.includes(id)
        );
      }

      if (intersection.length === 0) {
        break;
      }
    }

    return new StepResponse<{ finalOrderSetIds: string[] | null }>({
      finalOrderSetIds: intersection || [],
    });
  }
);
