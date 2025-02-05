import {
  IAddress,
  ICarrierAccount,
  ICustomsInfo,
  IParcel
} from '@easypost/api/types'

export type CreateShipment = {
  from_address: IAddress
  to_address: IAddress
  parce: IParcel
  reference?: string
  custom_info?: ICustomsInfo
  carrier_accounts?: ICarrierAccount[]
}
