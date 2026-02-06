![Mercur Main Cover](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67a225dc6fa298afc1cc4ae6_Mercur%20Cover.png)

<div align="center">
  <h1>Mercur <br> Open Source Marketplace Platform</h1> 
  <!-- Shields.io Badges -->
  <a href="https://github.com/mercurjs/mercur/tree/main?tab=MIT-1-ov-file">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="#">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://rigbyjs.com/#contact">
    <img alt="Support" src="https://img.shields.io/badge/support-contact%20author-blueviolet.svg" />
  </a>
  <p>
    <a href="https://mercurjs.com/">Mercur</a> |   <a href="https://docs.mercurjs.com/">Docs</a> 
  </p> 
</div>

# @mercurjs/easypost

This package is a part of MercurJS! Check our <a href="https://github.com/mercurjs/mercur">Github</a> for more information!

Each shipping option is different carrier. Then each carrier can have multiple options of delivery - this will be available when calculating price for delivery, since we don't know them beforehand and easypost simply calculates all possible options for a given from/to addresses. Due to that, you can only enable or disable specific carriers, but not their options.

Unfortunately to fetch available carriers a production api key is required. For local tests I recommend to use production key to set shipping options, then switch to test api key to test fulfillments, labels, tracking.

For the rates to be returned, weight must be set on product variants and address must be set on vendor.

## Enable plugin

Generate an API_KEY and insert it into .env as EASYPOST_API_KEY

First add the plugin to medusa-config.ts plugins section like this:

```
{
    resolve: '@mercurjs/easypost',
    options: {}
}
```

and in modules section as a fulfillment provider:

```
{
    resolve: '@medusajs/medusa/fulfillment',
    options: {
    providers: [
        {
        resolve: '@medusajs/medusa/fulfillment-manual',
        id: 'manual'
        },
        {
        resolve: '@mercurjs/easypost/providers/easypost',
        id: 'easypost',
        options: {
            api_key: process.env.EASYPOST_API_KEY
        }
        }
    ]
    }
}
```

Add fulfillment provider "Easypost" to stock location and configure shipping options as admin for selected carriers. **Make sure to add them as calculated!**

Then also vendor needs to add these shipping options on his side.

## Storefront integration

If you have a custom storefront, this also needs slight adjustments.

First, when calculated price of delivery is returned, the price shown is the lowest possible rate price. Besides that, rates array is appended that shows possible delivery options for given carrier. Here's an example response for USPS shipping option:

```
{
    "shipping_option": {
        "id": "so_01KERTN2Q3B04KFET9Y3HY8J7W",
        "name": "USPS",
        "price_type": "calculated",
        "service_zone_id": "serzo_01KERTK26291Q2BGCMMFW6RCKB",
        "shipping_profile_id": "sp_01KERTD2BY7MTQFBB4ANNX9B9N",
        "shipping_option_type_id": "sotype_01KERTD2E5FAGTMMVN7Z4FJX9T",
        "metadata": null,
        "calculated_price": {
            "calculated_amount": 45.98,
            "is_calculated_price_tax_inclusive": false,
            "shipment_id": "shp_f50a0d5f8f954bb0b1a9aa724799ec08",
            "rates": [
                {
                    "id": "rate_ad39458e41f449bfbb433e0b7aaf2db9",
                    "object": "Rate",
                    "created_at": "2026-01-12T10:40:59Z",
                    "updated_at": "2026-01-12T10:40:59Z",
                    "mode": "test",
                    "service": "Express",
                    "carrier": "USPS",
                    "rate": "189.35",
                    "currency": "USD",
                    "retail_rate": "212.65",
                    "retail_currency": "USD",
                    "list_rate": "189.35",
                    "list_currency": "USD",
                    "billing_type": "easypost",
                    "delivery_days": 2,
                    "delivery_date": null,
                    "delivery_date_guaranteed": false,
                    "est_delivery_days": 2,
                    "shipment_id": "shp_f50a0d5f8f954bb0b1a9aa724799ec08",
                    "carrier_account_id": "ca_0572c078b7a84122b57507747cdd850c",
                    "_params": {
                        "shipment": {
                            "from_address": {
                                "name": "test",
                                "street1": "417 Montgomery St",
                                "city": "San Francisco",
                                "state": "CA",
                                "zip": "94104",
                                "country": "US"
                            },
                            "to_address": {
                                "name": "null null",
                                "street1": "164 Townsend St",
                                "city": "San Francisco",
                                "state": "CA",
                                "zip": "94104",
                                "country": "US"
                            },
                            "parcel": {
                                "weight": 1000
                            }
                        }
                    }
                },
                {
                    "id": "rate_4a36da21247a47e781e9bbd8540dcab2",
                    "object": "Rate",
                    "created_at": "2026-01-12T10:40:59Z",
                    "updated_at": "2026-01-12T10:40:59Z",
                    "mode": "test",
                    "service": "Priority",
                    "carrier": "USPS",
                    "rate": "52.71",
                    "currency": "USD",
                    "retail_rate": "63.15",
                    "retail_currency": "USD",
                    "list_rate": "52.71",
                    "list_currency": "USD",
                    "billing_type": "easypost",
                    "delivery_days": 2,
                    "delivery_date": null,
                    "delivery_date_guaranteed": false,
                    "est_delivery_days": 2,
                    "shipment_id": "shp_f50a0d5f8f954bb0b1a9aa724799ec08",
                    "carrier_account_id": "ca_0572c078b7a84122b57507747cdd850c",
                    "_params": {
                        "shipment": {
                            "from_address": {
                                "name": "test",
                                "street1": "417 Montgomery St",
                                "city": "San Francisco",
                                "state": "CA",
                                "zip": "94104",
                                "country": "US"
                            },
                            "to_address": {
                                "name": "null null",
                                "street1": "164 Townsend St",
                                "city": "San Francisco",
                                "state": "CA",
                                "zip": "94104",
                                "country": "US"
                            },
                            "parcel": {
                                "weight": 1000
                            }
                        }
                    }
                },
                {
                    "id": "rate_1debd93ec8484d45b83413732a7e29c1",
                    "object": "Rate",
                    "created_at": "2026-01-12T10:40:59Z",
                    "updated_at": "2026-01-12T10:40:59Z",
                    "mode": "test",
                    "service": "GroundAdvantage",
                    "carrier": "USPS",
                    "rate": "45.98",
                    "currency": "USD",
                    "retail_rate": "56.05",
                    "retail_currency": "USD",
                    "list_rate": "45.98",
                    "list_currency": "USD",
                    "billing_type": "easypost",
                    "delivery_days": 2,
                    "delivery_date": null,
                    "delivery_date_guaranteed": false,
                    "est_delivery_days": 2,
                    "shipment_id": "shp_f50a0d5f8f954bb0b1a9aa724799ec08",
                    "carrier_account_id": "ca_0572c078b7a84122b57507747cdd850c",
                    "_params": {
                        "shipment": {
                            "from_address": {
                                "name": "test",
                                "street1": "417 Montgomery St",
                                "city": "San Francisco",
                                "state": "CA",
                                "zip": "94104",
                                "country": "US"
                            },
                            "to_address": {
                                "name": "null null",
                                "street1": "164 Townsend St",
                                "city": "San Francisco",
                                "state": "CA",
                                "zip": "94104",
                                "country": "US"
                            },
                            "parcel": {
                                "weight": 1000
                            }
                        }
                    }
                }
            ]
        },
        "amount": 45.98,
        "is_tax_inclusive": false
    }
}
```

Frontend should show user possible rates so that he can select one. After that, when setting shipping option for cart, you need to pass shipment_id and rate_id from previous response. So the body for `POST /store/carts/:id/shipping-methods` for example would be:

```
{
    "option_id": "so_test",
    "data": {
        "shipment_id": "shp_test",
        "rate_id": "rate_test"
    }
}
```
