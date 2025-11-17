import { PaymentMethodSetupInfo } from '@adyen/api-library/lib/src/typings/management/paymentMethodSetupInfo';

// TODO: this should be configurable on the frontend side.
export const AdyenCountries = [
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
    'GB'
  ];

  export const AdyenDefaultPaymentMethods = [
    {
      type: PaymentMethodSetupInfo.TypeEnum.Amex,
      currencies: ['GBP'],
      countries: AdyenCountries,
    },
    {
      type: PaymentMethodSetupInfo.TypeEnum.Mc,
      currencies: ['GBP', 'EUR'],
      countries: AdyenCountries,
    },
    {
      type: PaymentMethodSetupInfo.TypeEnum.Visa,
      currencies: ['GBP', 'EUR'],
      countries: AdyenCountries,
    },
  ];