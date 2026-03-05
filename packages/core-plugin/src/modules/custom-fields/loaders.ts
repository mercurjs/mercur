import { LoaderOptions, ModuleJoinerConfig } from "@medusajs/framework/types";
import {
  camelToSnakeCase,
} from "@medusajs/framework/utils";
import { CustomFieldsModuleOptions } from "@mercurjs/types";
import { MedusaModule } from "@medusajs/framework/modules-sdk";

export default async function customFieldsLoader({
  logger,
  options,
}: LoaderOptions) {
  const { customFields = {} } = (options ?? {}) as CustomFieldsModuleOptions;

  MedusaModule.setCustomLink((joinerConfigs) => {
    const entityJoinerConfigMap = new Map<string, ModuleJoinerConfig>();

    for (const joinerConfig of joinerConfigs) {
      const aliases = Array.isArray(joinerConfig.alias)
        ? joinerConfig.alias
        : [joinerConfig.alias];
      aliases.forEach((alias) => {
        if (alias?.entity) {
          entityJoinerConfigMap.set(alias.entity, joinerConfig);
        }
      });
    }

    const extendsConfig: {
      serviceName: string;
      entity: string;
      fieldAlias: Record<string, { path: string; isList: boolean }>;
      relationship: {
        serviceName: string;
        primaryKey: string;
        foreignKey: string;
        alias: string;
        isList: boolean;
      };
    }[] = [];

    Object.entries(customFields ?? {}).forEach(([entityName]) => {
      const joinerConfig = entityJoinerConfigMap.get(entityName);

      if (!joinerConfig || !joinerConfig.serviceName) {
        logger?.error(`Invalid entity name: ${entityName}`);
        return;
      }

      const snakeEntity = camelToSnakeCase(entityName);
      const linkableKey = `${snakeEntity}_id`;
      const relationshipAlias = `${snakeEntity}_custom_fields_link`;

      extendsConfig.push({
        serviceName: joinerConfig.serviceName!,
        entity: entityName,
        fieldAlias: {
          custom_fields: {
            path: relationshipAlias,
            isList: false,
          },
        },
        relationship: {
          serviceName: "custom_fields",
          primaryKey: linkableKey,
          foreignKey: "id",
          alias: relationshipAlias,
          isList: false,
        },
      });
    });

    return {
      isLink: true,
      isReadOnlyLink: true,
      extends: extendsConfig,
    };
  });
}
