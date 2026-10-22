import { ModuleProvider, Modules } from '@medusajs/framework/utils';

import SpraayPayoutProviderService from './services/spraay-payout';

export { SpraayPayoutProviderService };
export type { SpraayPayoutOptions } from './services/spraay-payout';

export default ModuleProvider(Modules.PAYMENT, {
    services: [SpraayPayoutProviderService],
});
