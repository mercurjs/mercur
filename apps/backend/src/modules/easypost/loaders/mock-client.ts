import { GetAccountsResponse } from './validators'

const mockEasyPostClient = () => {
  const getCarrierAccounts = async () =>
    GetAccountsResponse.parse([
      {
        id: 'ca_3c870664d65c440d96ad1f3c3208eef8',
        object: 'CarrierAccount',
        type: 'UspsAccount',
        description: 'USPS Account',
        readable: 'USPS',
        logo: null,
        created_at: '2025-02-03T17:40:03.000Z',
        updated_at: '2025-02-03T17:40:03.000Z'
      },
      {
        id: 'ca_4ff6f93867e34eedad7a66d94734588a',
        object: 'CarrierAccount',
        type: 'DhlExpressDefaultAccount',
        description: 'DHL Express Account',
        readable: 'DHL Express',
        logo: null,
        created_at: '2025-02-03T17:40:03.000Z',
        updated_at: '2025-02-03T17:40:03.000Z'
      },
      {
        id: 'ca_0e3e2fe346f143998ea3501867b5cb4d',
        object: 'CarrierAccount',
        type: 'FedexDefaultAccount',
        description: 'FedEx Default Account',
        readable: 'FedEx Default',
        logo: null,
        created_at: '2025-02-03T17:40:03.000Z',
        updated_at: '2025-02-03T17:40:03.000Z'
      },
      {
        id: 'ca_6469a836de1345288302cd1a8f80c739',
        object: 'CarrierAccount',
        type: 'UpsDapAccount',
        description: 'UPS Account',
        readable: 'UPSDAP',
        logo: null,
        created_at: '2025-02-03T17:43:41.000Z',
        updated_at: '2025-02-03T17:43:41.000Z'
      }
    ])

  return { getCarrierAccounts }
}

export default mockEasyPostClient()
