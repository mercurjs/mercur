import Stripe from "stripe";

import { MedusaService } from "@medusajs/framework/utils";

import TaxCode from "./models/taxcode";

type ModuleOptions = {
  apiKey: string;
};

export default class TaxCodeService extends MedusaService({ TaxCode }) {
  private readonly stripe_: Stripe;

  constructor(_, { apiKey }: ModuleOptions) {
    super(_);
    this.stripe_ = new Stripe(apiKey || "sk_");
  }

  async getTaxCodes(): Promise<Stripe.TaxCode[]> {
    let response = await this.stripe_.taxCodes.list({ limit: 100 });

    const taxCodes: Stripe.TaxCode[] = [...response.data];
    while (response.has_more) {
      const lastId = response.data.pop()!.id;
      const currentResponse = await this.stripe_.taxCodes.list({
        limit: 100,
        starting_after: lastId,
      });
      taxCodes.push(...currentResponse.data);
      response = currentResponse;
    }

    return taxCodes;
  }
}
