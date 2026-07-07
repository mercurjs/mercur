import type {
    NavigationConfig,
    WidgetConfig,
} from "./types"
import type { CustomFieldModel, CustomFieldsConfig } from "./custom-fields"

/**
 * Wraps a declarative config so Vite's Fast Refresh treats the module as a
 * React component boundary — mirrors Medusa's `admin-sdk` config helpers so
 * editing a config with an inline component hot-reloads instead of full-page
 * reloading. The `$$typeof` marker is stripped by the build-time crawl.
 */
function createConfigHelper<TConfig extends object>(config: TConfig): TConfig {
    return {
        ...config,
        $$typeof: Symbol.for("react.memo"),
    } as TConfig
}

export function defineWidgetConfig(config: WidgetConfig): WidgetConfig {
    return createConfigHelper(config)
}

export function defineNavigationConfig(
    config: NavigationConfig
): NavigationConfig {
    return createConfigHelper(config)
}

export function defineCustomFieldsConfig<TModel extends CustomFieldModel>(
    config: CustomFieldsConfig<TModel>
): CustomFieldsConfig<TModel> {
    return createConfigHelper(config)
}
