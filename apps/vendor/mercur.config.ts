import type { MercurConfig } from '@mercurjs/dashboard-sdk'

export default {
    title: 'test',
    description: 'test',
    components: {
        Sidebar: './sidebar'
    },
    baseUrl: 'http://localhost:3000',
} satisfies MercurConfig