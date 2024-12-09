/**
 * Generated by orval v7.3.0 🍺
 * Do not edit manually.
 * Medusa API
 * OpenAPI spec version: 1.0.0
 */
import type { StoreShippingOptionData } from './storeShippingOptionData';
import type { StoreShippingOptionMetadata } from './storeShippingOptionMetadata';
import type { StoreShippingOptionPriceType } from './storeShippingOptionPriceType';
import type { BaseFulfillmentProvider } from './baseFulfillmentProvider';
import type { StoreShippingOptionType } from './storeShippingOptionType';

/**
 * The shipping option's details.
 */
export interface StoreShippingOption {
  /** The shipping option's amount. */
  amount: number;
  /** The shipping option's data, useful for the provider handling fulfillment. */
  data: StoreShippingOptionData;
  /** The shipping option's ID. */
  id: string;
  /** Whether the amount includes taxes. */
  is_tax_inclusive: boolean;
  /** The shipping option's metadata, can hold custom key-value pairs. */
  metadata: StoreShippingOptionMetadata;
  /** The shipping option's name. */
  name: string;
  /** The shipping option's price type. If it's `flat`, the price is fixed and is set in the `prices` property. If it's `calculated`, the price is calculated on checkout by the associated fulfillment provider. */
  price_type: StoreShippingOptionPriceType;
  provider: BaseFulfillmentProvider;
  /** The ID of the fulfillment provider handling this option. */
  provider_id: string;
  /** The ID of the service zone the shipping option belongs to. */
  service_zone_id: string;
  /** The ID of the shipping option's type. */
  shipping_option_type_id: string;
  /** The ID of the associated shipping profile. */
  shipping_profile_id: string;
  type: StoreShippingOptionType;
}
