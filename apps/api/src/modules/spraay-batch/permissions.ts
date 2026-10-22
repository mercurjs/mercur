import { defineMercurPermissions } from '@mercurjs/core/permissions/registry';

export const SPRAAY_SIGN_PERMISSION = 'spraay.sign';

export const spraayPermissions = defineMercurPermissions([
    {
        key: SPRAAY_SIGN_PERMISSION,
        group: 'payouts',
        surface: ['admin'],
        rights: ['edit'],
        requires: [{ key: 'payouts', right: 'view' }],
        label: 'Sign Spraay batches',
        description: 'Submit treasury-signed Spraay batch transactions for broadcast',
    },
]);
