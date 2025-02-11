import {
  IAddress,
  ICarrierAccount,
  ICustomsInfo,
  IParcel
} from '@easypost/api/types'
import { z } from 'zod'

import { CarrierAccount } from './loaders/validators'

export type CreateShipment = {
  from_address: IAddress
  to_address: IAddress
  parcel: IParcel
  reference?: string
  custom_info?: ICustomsInfo
  carrier_accounts?: ICarrierAccount[]
}

export type CarrierAccount = z.infer<typeof CarrierAccount>
