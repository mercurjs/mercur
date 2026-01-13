import { getApplicableAttributes } from "../../../shared/infra/http/utils/products";

export type ApplicableAttribute = Awaited<
  ReturnType<typeof getApplicableAttributes>
>[number];
