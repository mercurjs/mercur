export interface MercurConfig {
    title: string
    description: string
    components: {
        Sidebar?: string
    }
}

export interface BuiltMercurConfig extends MercurConfig {
    root: string
    srcDir: string
    configPath: string
}

export function buildConfig(config: MercurConfig): BuiltMercurConfig {
    const root = process.cwd()
    const srcDir = `${root}/src`
    const configPath = `${root}/mercur.config.ts`

    return {
        ...config,
        root,
        srcDir,
        configPath,
    }
}

export { default } from './app'
