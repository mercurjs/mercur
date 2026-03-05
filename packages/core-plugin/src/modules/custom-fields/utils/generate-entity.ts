import {
    compressName,
    mikroOrmSoftDeletableFilterOptions,
    simpleHash,
    SoftDeletableFilterKey,
} from "@medusajs/framework/utils"

import { EntityKey, EntitySchema } from "@medusajs/framework/mikro-orm/core"
import { Field } from "@mercurjs/types"

function getClass(className: string, ...properties) {
    const cls = {
        [className]: class {
            constructor(...values) {
                properties.forEach((name, idx) => {
                    this[name] = values[idx]
                })
            }
        }
    }
    return cls[className]
}

export function generateEntity(
    tableName: string,
    fields: (Field & { name: string })[]
) {
    // e.g. "product_custom_fields" -> "product_id"
    const entityName = tableName.replace(/_custom_fields$/, "")
    const foreignKeyName = `${entityName}_id`
    const fieldNames = [foreignKeyName, ...fields.map((f) => f.name)]

    const typeMap: Record<string, string> = {
        string: "string",
        text: "text",
        integer: "number",
        float: "number",
        boolean: "boolean",
        date: "date",
        time: "time",
        datetime: "date",
        json: "any",
        array: "array",
        enum: "enum",
    }

    const properties = fields.reduce((acc, field) => {
        const prop: Record<string, any> = {
            type: typeMap[field.type] ?? field.type,
            nullable: field.nullable ?? true,
            ...(field.defaultValue !== undefined
                ? {
                    defaultRaw: typeof field.defaultValue === 'string'
                        ? `'${field.defaultValue.replace(/'/g, "''")}'`
                        : String(field.defaultValue)
                }
                : {}),
        }

        if (field.type === "enum" && "enum" in field) {
            prop.items = () => field.enum
            prop.enum = true
        }

        acc[field.name] = prop
        return acc
    }, {} as Record<string, any>)

    const hashTableName = simpleHash(tableName)
    const compressed = compressName(tableName)

    return new EntitySchema({
        class: getClass(
            tableName,
            ...fieldNames.concat("created_at", "updated_at", "deleted_at")
        ) as any,
        tableName: compressed,
        properties: {
            id: {
                type: "string",
                nullable: false,
                primary: true,
            },
            [foreignKeyName]: {
                type: "string",
                nullable: false,
            },
            ...properties,
            created_at: {
                columnType: "timestamptz",
                type: "date",
                nullable: false,
                defaultRaw: "CURRENT_TIMESTAMP",
            },
            updated_at: {
                columnType: "timestamptz",
                type: "date",
                nullable: false,
                defaultRaw: "CURRENT_TIMESTAMP",
            },
            deleted_at: {
                columnType: "timestamptz",
                type: "date",
                nullable: true,
            },
        } as any,
        filters: {
            [SoftDeletableFilterKey]: mikroOrmSoftDeletableFilterOptions,
        },
        hooks: {
            beforeUpdate: [
                (args) => {
                    args.entity.updated_at = new Date()
                },
            ],
        },
        indexes: [
            {
                properties: ["id"],
                name: "IDX_id_" + hashTableName,
            },
            {
                properties: ["deleted_at"],
                name: "IDX_deleted_at_" + hashTableName,
            },
            {
                properties: [foreignKeyName as EntityKey<{ id: any; } & { deleted_at: any; }, false>],
                name: "IDX_unique_" + hashTableName,
                options: { unique: true },
                expression: `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_unique_${hashTableName}" ON "${compressed}" ("${foreignKeyName}") WHERE "deleted_at" IS NULL`,
            },
        ],
    })
}
