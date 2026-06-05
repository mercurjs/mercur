import { LoaderOptions, ModuleJoinerConfig } from "@medusajs/framework/types";
import {
  camelToSnakeCase,
  DALUtils,
  ModulesSdkUtils,
  normalizeMigrationSQL,
} from "@medusajs/framework/utils";
import { DatabaseSchema } from "@medusajs/framework/mikro-orm/knex";
import { CustomFieldsModuleOptions } from "@mercurjs/types";
import { MedusaModule } from "@medusajs/framework/modules-sdk";
import { generateEntity } from "./utils/generate-entity";

function pickTableRelatedCommands(tableNames: string[], sqlCommand: string) {
  const ignoreColumns = ["created_at", "updated_at", "deleted_at"];
  const commands = sqlCommand.split(";");
  const returnedCommands = commands
    .filter((command) => {
      const cmd = command.trim();
      return (
        cmd.length &&
        cmd !== "set names 'utf8'" &&
        tableNames.some((t) => cmd.includes(`"${t}"`)) &&
        !ignoreColumns.some((column) => cmd.includes(`column "${column}"`))
      );
    })
    .map((cmd) => cmd.trim());

  if (returnedCommands.length > 0) {
    returnedCommands.push("");
  }

  return returnedCommands.join(";");
}

async function syncCustomFields(
  logger: LoaderOptions["logger"],
  customFields: NonNullable<CustomFieldsModuleOptions["customFields"]>,
) {
  const tableNames: string[] = [];
  const entities = Object.entries(customFields).map(([entityName, fields]) => {
    const tableName = `${camelToSnakeCase(entityName)}_custom_fields`;
    tableNames.push(tableName);

    const fieldDefs = Object.entries(fields ?? {}).map(([name, field]) => ({
      ...field,
      name,
      nullable: field.nullable ?? true,
      defaultValue: field.defaultValue ?? null,
    }));

    return generateEntity(tableName, fieldDefs);
  });

  if (!entities.length) {
    logger?.info("No custom fields configured. Skipping.");
    return;
  }

  logger?.info("Syncing custom fields...");

  const dbConfig = ModulesSdkUtils.loadDatabaseConfig("custom_fields");
  const orm = await DALUtils.mikroOrmCreateConnection(dbConfig, entities, "");

  try {
    const generator = orm.getSchemaGenerator();
    const connection = orm.em.getConnection();
    const platform = orm.em.getPlatform();
    const schemaName = dbConfig.schema || "public";

    const dbSchema = new DatabaseSchema(platform, schemaName);
    try {
      await platform.getSchemaHelper?.()?.loadInformationSchema(
        dbSchema,
        connection,
        tableNames.map((table_name) => ({
          table_name,
          schema_name: schemaName,
        })),
      );
    } catch {
      // Tables don't exist yet — empty schema will generate CREATE TABLE
    }

    const rawSql = normalizeMigrationSQL(
      await generator.getUpdateSchemaSQL({
        fromSchema: dbSchema,
      }),
    );

    const sql = pickTableRelatedCommands(tableNames, rawSql);

    if (sql) {
      await connection.execute(sql);
      logger?.info("Custom fields migrated successfully.");
    } else {
      logger?.info("Custom fields are up to date.");
    }
  } finally {
    await orm.close(true);
  }
}

export default async function customFieldsLoader({
  logger,
  options,
}: LoaderOptions) {
  const { customFields = {} } = (options ?? {}) as CustomFieldsModuleOptions;

  const isMigration = process.argv.some((arg) => arg.includes("db:migrate"));

  if (isMigration) {
    await syncCustomFields(logger, customFields);
  }

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
