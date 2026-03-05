import { CustomFieldsModuleOptions } from "@mercurjs/types";
import { FindConfig } from "@medusajs/framework/types";
import {
    MedusaError,
    compressName,
    generateEntityId,
    camelToSnakeCase,
} from "@medusajs/framework/utils";
import { MedusaModule } from "@medusajs/framework/modules-sdk";

export default class CustomFieldsModuleService {
    protected readonly options_: CustomFieldsModuleOptions;
    protected aliasToEntityMap_: Map<string, string> = new Map();
    protected pgConnection_: any;

    __hooks = {
        onApplicationStart: async () => {
            this.onApplicationStart();
        },
    };

    constructor(container, options: CustomFieldsModuleOptions) {
        this.options_ = options;
        this.pgConnection_ = container.__pg_connection__;
    }

    async onApplicationStart(): Promise<void> {
        this.buildAliasToEntityMap_();
    }

    protected buildAliasToEntityMap_(): void {
        const joinerConfigs = MedusaModule.getAllJoinerConfigs();
        const entityNames = Object.keys(this.options_.customFields ?? {});

        for (const joinerConfig of joinerConfigs) {
            const joinerConfigAliases = Array.isArray(joinerConfig.alias)
                ? joinerConfig.alias
                : [joinerConfig.alias!];

            for (const entityName of entityNames) {
                const entityAlias = joinerConfigAliases.find(
                    (alias) => alias?.entity === entityName,
                );

                if (!entityAlias) {
                    continue;
                }

                const names = Array.isArray(entityAlias.name)
                    ? entityAlias.name
                    : [entityAlias.name];

                const snakeEntity = camelToSnakeCase(entityName);

                for (const name of names) {
                    this.aliasToEntityMap_.set(name, snakeEntity);
                }
            }
        }
    }

    async list(
        filter: Record<string, string | string[]>,
        config: FindConfig<any>,
    ) {
        if (Object.keys(filter).length !== 1) {
            throw new MedusaError(
                MedusaError.Types.INVALID_ARGUMENT,
                "Only single filter is allowed",
            );
        }

        const filterKey = Object.keys(filter)[0];
        const filterValue = filter[filterKey];
        const alias = filterKey.split("_").slice(0, -1).join("_");
        const tableName = compressName(`${alias}_custom_fields`);
        const knex = this.pgConnection_;

        const query = knex(tableName).whereNull("deleted_at");

        if (Array.isArray(filterValue)) {
            query.whereIn(filterKey, filterValue);
        } else {
            query.where(filterKey, filterValue);
        }

        if (config.select) {
            query.select(config.select as string[]);
        }

        return await query;
    }

    protected resolveAlias_(alias: string): string {
        const snakeEntity = this.aliasToEntityMap_.get(alias);

        if (!snakeEntity) {
            throw new MedusaError(
                MedusaError.Types.INVALID_ARGUMENT,
                `Unknown custom fields alias: ${alias}`,
            );
        }

        return snakeEntity;
    }

    async upsert(
        alias: string,
        data:
            | { id: string;[key: string]: unknown }
            | { id: string;[key: string]: unknown }[],
    ) {
        const items = Array.isArray(data) ? data : [data];
        const snakeEntity = this.resolveAlias_(alias);
        const foreignKey = snakeEntity + "_id";
        const tableName = compressName(`${snakeEntity}_custom_fields`);
        const knex = this.pgConnection_;

        const foreignKeyValues = items.map((entry) => entry.id);

        const existing = await knex(tableName)
            .whereIn(foreignKey, foreignKeyValues)
            .whereNull("deleted_at");

        const existingMap = new Map<
            string,
            { id: string; fields: Record<string, unknown> }
        >(
            existing.map((row) => [
                row[foreignKey],
                row,
            ]),
        );

        const toInsert: Record<string, unknown>[] = [];
        const toUpdate: { id: string; fields: Record<string, unknown> }[] = [];

        for (const item of items) {
            const { id, ...fields } = item;
            const existingRow = existingMap.get(id);
            if (existingRow) {
                toUpdate.push({ id: existingRow.id as string, fields });
            } else {
                toInsert.push({
                    ...fields,
                    [foreignKey]: id,
                    id: generateEntityId(undefined as any, "cf"),
                });
            }
        }

        await knex.transaction(async (trx) => {
            if (toInsert.length) {
                await trx(tableName).insert(toInsert);
            }
            for (const { id, fields } of toUpdate) {
                await trx(tableName)
                    .where("id", id)
                    .update({ ...fields, updated_at: new Date() });
            }
        });

        return items;
    }

    async delete(alias: string, ids: string | string[]) {
        const items = Array.isArray(ids) ? ids : [ids];
        const snakeEntity = this.resolveAlias_(alias);
        const tableName = compressName(`${snakeEntity}_custom_fields`);
        const knex = this.pgConnection_;

        await knex.transaction(async (trx) => {
            await trx(tableName)
                .whereIn(`${snakeEntity}_id`, items)
                .update({ deleted_at: new Date() });
        });
    }
}
