import type { MercurConfig } from '@mercurjs/dashboard-sdk'

export default {
    title: 'test',
    description: 'test',
    components: {
        Sidebar: './sidebar'
    },
    baseUrl: 'https://api-mercurjs.up.railway.app',
} satisfies MercurConfig