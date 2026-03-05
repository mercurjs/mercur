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
                    (alias) => alias?.entity === entityName
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
            throw new MedusaError(MedusaError.Types.INVALID_ARGUMENT, 'Only single filter is allowed');
        }

        const filterKey = Object.keys(filter)[0];
        const filterValue = filter[filterKey];
        const alias = filterKey.split('_').slice(0, -1).join('_');
        const tableName = compressName(`${alias}_custom_fields`);
        const knex = this.pgConnection_;

        const query = knex(tableName).whereNull('deleted_at');

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
                `Unknown custom fields alias: ${alias}`
            );
        }

        return snakeEntity;
    }

    async create(
        alias: string,
        data: { id: string;[key: string]: unknown }[]
    ) {
        const snakeEntity = this.resolveAlias_(alias);
        const tableName = compressName(`${snakeEntity}_custom_fields`);
        const knex = this.pgConnection_;


        const rows = data.map((entry) => {
            const { id, ...fields } = entry
            return {
                ...fields,
                [snakeEntity + '_id']: id,
                id: generateEntityId(undefined as any, "cf"),
            }
        });

        await knex.transaction(async (trx) => {
            await trx(tableName).insert(rows);
        });

        return rows;
    }

    async update(
        alias: string,
        data: { id: string;[key: string]: unknown }[],
    ) {
        const snakeEntity = this.resolveAlias_(alias);
        const tableName = compressName(`${snakeEntity}_custom_fields`);
        const knex = this.pgConnection_;

        await knex.transaction(async (trx) => {
            for (const { id, ...fields } of data) {
                await trx(tableName)
                    .where(`${snakeEntity + '_id'}`, id)
                    .update({ ...fields, updated_at: new Date() });
            }
        });

        return data;
    }

    async delete(
        alias: string,
        ids: string[],
    ) {
        const snakeEntity = this.resolveAlias_(alias);
        const tableName = compressName(`${snakeEntity}_custom_fields`);
        const knex = this.pgConnection_;

        await knex.transaction(async (trx) => {
            await trx(tableName)
                .whereIn('id', ids)
                .update({ deleted_at: new Date() });
        });
    }
}
