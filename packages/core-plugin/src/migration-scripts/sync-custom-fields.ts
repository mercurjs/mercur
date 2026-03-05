import { ExecArgs } from "@medusajs/framework/types";
import {
  camelToSnakeCase,
  ContainerRegistrationKeys,
  DALUtils,
  ModulesSdkUtils,
  normalizeMigrationSQL,
} from "@medusajs/framework/utils";
import { DatabaseSchema } from "@medusajs/framework/mikro-orm/knex";
import { generateEntity } from "../modules/custom-fields/utils/generate-entity";
import { CUSTOM_FIELDS_MODULE, CustomFieldsModuleOptions } from "../modules/custom-fields";

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

export default async function syncCustomFields({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const configModule = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE);

  let moduleConfig;
  if (configModule.modules) {
    for (const [key, value] of Object.entries(configModule.modules)) {
      if (
        key === CUSTOM_FIELDS_MODULE ||
        (typeof value === "object" &&
          value !== null &&
          "resolve" in value &&
          value.resolve === "./src/modules/custom-fields")
      ) {
        moduleConfig = value;
        break;
      }
    }
  }

  const options = (moduleConfig?.options ?? {}) as CustomFieldsModuleOptions;
  const { customFields = {} } = options;

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
    logger.info("No custom fields configured. Skipping.");
    return;
  }

  logger.info("Syncing custom fields...");

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
      logger.info("Custom fields migrated successfully.");
    } else {
      logger.info("Custom fields are up to date.");
    }
  } finally {
    await orm.close(true);
  }
}
