import EasyPostClient from "@easypost/api";
import { EntityManager, Knex } from "@medusajs/framework/mikro-orm/knex";

import {
  CalculateShippingOptionPriceDTO,
  CalculatedShippingOptionPrice,
  CreateFulfillmentResult,
  FulfillmentOption,
  Logger,
} from "@medusajs/framework/types";
import {
  AbstractFulfillmentProviderService,
  MedusaError,
} from "@medusajs/framework/utils";

export type EasyPostOptions = {
  api_key: string;
};

type InjectedDependencies = {
  logger: Logger;
  manager: EntityManager;
};

type EasyPostClient = InstanceType<typeof EasyPostClient>;

class EasyPostProviderService extends AbstractFulfillmentProviderService {
  static identifier = "easypost";
  protected options_: EasyPostOptions;
  protected logger_: Logger;
  protected easypost_: EasyPostClient;
  protected knex_: Knex;

  constructor(
    { logger, manager }: InjectedDependencies,
    options: EasyPostOptions
  ) {
    super();

    this.options_ = options;
    this.logger_ = logger;
    this.knex_ = manager.getKnex();

    this.easypost_ = new EasyPostClient(options.api_key);

    if (!this.easypost_) {
      throw new Error("Failed to initialize EasyPost");
    }
  }

  private async createShipment(context): Promise<EasyPostClient.Shipment> {
    const weight = context.items.reduce(
      (acc, item) =>
        acc + Number(item["variant"]?.weight ?? 0) * Number(item.quantity),
      0
    );

    return this.easypost_.Shipment.create({
      from_address: {
        name:
          context.from_location.address.company || context.from_location.name,
        street1: context.from_location.address.address_1,
        street2: context.from_location.address.address_2 || undefined,
        city: context.from_location.address.city,
        state: context.from_location.address.province || undefined,
        zip: context.from_location.address.postal_code,
        country: context.from_location.address.country_code.toUpperCase(),
        phone: context.from_location.address.phone || undefined,
      },
      to_address: {
        name: `${context.shipping_address.first_name} ${context.shipping_address.last_name}`,
        company: context.shipping_address.company || undefined,
        street1: context.shipping_address.address_1,
        street2: context.shipping_address.address_2 || undefined,
        city: context.shipping_address.city,
        state: context.shipping_address.province || undefined,
        zip: context.shipping_address.postal_code,
        country:
          context.shipping_address.country_code?.toUpperCase() || undefined,
        phone: context.shipping_address.phone || undefined,
      },
      ...(weight > 0 ? { parcel: { weight } } : {}),
    });
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    try {
      const carriers = await this.easypost_.CarrierAccount.all(); // Requires production API key

      const fulfillmentOptions: FulfillmentOption[] = carriers.map(
        (carrier) => ({
          id: carrier.id,
          name: carrier.readable,
          carrier_name: carrier.type,
          type: carrier.type,
          description: carrier.description,
        })
      );

      return fulfillmentOptions;
    } catch (e) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        `EasyPost: ` + e.message
      );
    }
  }

  async canCalculate(): Promise<boolean> {
    return true;
  }

  async calculatePrice(
    optionData: CalculateShippingOptionPriceDTO["optionData"],
    data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ) {
    if (!context.from_location) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Missing from location"
      );
    }

    if (!context.from_location.address) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Missing from location address"
      );
    }

    if (!context.shipping_address) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Missing shipping address"
      );
    }

    let shipment: EasyPostClient.Shipment;

    if (data.shipment_id) {
      shipment = await this.easypost_.Shipment.retrieve(
        data.shipment_id as string
      );
    } else {
      shipment = await this.createShipment(context);
    }

    const cartCurrencyCode = (await this.knex_("cart")
      .where("id", "=", context.id as string)
      .select("currency_code")
      .first()).currency_code as string;

    const rates = shipment.rates.filter(
      (rate) =>
        rate.carrier_account_id === optionData.id &&
        cartCurrencyCode.toLowerCase() === rate.currency.toLowerCase()
    );

    if (!rates || !rates.length) {
      return {
        calculated_amount: 0,
        is_calculated_price_tax_inclusive: false,
        rates: null,
      };
    }

    const calculated_amount = Number(
      data.rate_id
        ? rates.find((rate) => rate.id === data.rate_id)?.rate
        : rates.sort((a, b) => Number(a.rate) - Number(b.rate))[0].rate
    );

    return {
      calculated_amount,
      is_calculated_price_tax_inclusive: false,
      shipment_id: shipment.id,
      rates: shipment.rates, // Easypost returns multiple rates per shipping option, so we return them to front so it can choose the best one. By default we use cheapest option
    };
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>
  ) {
    // Frontend needs to pass shipment and rate id to ensure the same price as calculated
    if (!data.rate_id || !data.shipment_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "For EasyPost shipping method you have to select shipment and rate"
      );
    }

    return {
      ...data,
    };
  }

  async createFulfillment(
    data: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    let shipment = await this.easypost_.Shipment.retrieve(
      data.shipment_id as string
    );

    if (shipment.postage_label) {
      shipment = await this.easypost_.Shipment.buy(
        data.shipment_id as string,
        data.rate_id as string
      );
    }

    return {
      data: {
        ...shipment,
        labels: shipment.postage_label.label_url,
      },
      labels: [
        {
          tracking_number: shipment.tracking_code,
          tracking_url: shipment.tracker.public_url,
          label_url: shipment.postage_label.label_url,
        },
      ],
    };
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<void> {
    await this.easypost_.Shipment.refund(data.shipment_id as string);
  }
}

export default EasyPostProviderService;
