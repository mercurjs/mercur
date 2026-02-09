import type { MercurConfig } from '@mercurjs/dashboard-sdk'

export default {
    title: 'test',
    description: 'test',
    components: {
        MainSidebar: './sidebar'
    },
    baseUrl: 'http://localhost:9000',
} satisfies MercurConfig