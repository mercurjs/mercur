import { InjectManager, InjectTransactionManager, MedusaContext, MedusaService } from "@medusajs/framework/utils"
import { Context } from "@medusajs/framework/types"
import { EntityManager, type Knex } from "@medusajs/framework/mikro-orm/knex"

import { Conversation } from "./models/conversation"
import { Message } from "./models/message"
import { CursorPaginatedResult, ConversationDTO, MessageDTO } from "./types/common"

const MAX_PREVIEW_LENGTH = 100

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

export function encodeCursor(values: Record<string, string | number | null>): string {
  return Buffer.from(JSON.stringify(values)).toString("base64url")
}

export function decodeCursor(cursor: string): Record<string, string | number | null> | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"))
  } catch {
    return null
  }
}

class MessagingModuleService extends MedusaService({
  Conversation,
  Message,
}) {
  @InjectManager()
  async listConversationsCursor(
    filter: { buyer_id?: string; seller_id?: string },
    pagination: { cursor?: string | null; limit?: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<CursorPaginatedResult<ConversationDTO>> {
    const knex = sharedContext!.manager!.getKnex()
    const limit = Math.min(pagination.limit ?? 20, 50)

    let query = knex("conversation")
      .select("*")
      .where("deleted_at", null)
      .orderBy("last_message_at" as any, "desc")
      .orderBy("id" as any, "desc")
      .limit(limit + 1)

    if (filter.buyer_id) {
      query = query.where("buyer_id", filter.buyer_id)
    }

    if (filter.seller_id) {
      query = query.where("seller_id", filter.seller_id)
    }

    if (pagination.cursor) {
      const decoded = decodeCursor(pagination.cursor)
      if (decoded && decoded.last_message_at && decoded.id) {
        query = query.where(function () {
          this.where("last_message_at", "<", decoded.last_message_at!)
            .orWhere(function () {
              this.where("last_message_at", "=", decoded.last_message_at!)
                .andWhere("id", "<", decoded.id!)
            })
        })
      }
    }

    const rows: any[] = await query

    const hasMore = rows.length > limit
    const data = hasMore ? rows.slice(0, limit) : rows

    let next_cursor: string | null = null
    if (hasMore && data.length > 0) {
      const lastRow = data[data.length - 1]
      next_cursor = encodeCursor({
        last_message_at: lastRow.last_message_at?.toISOString?.() ?? lastRow.last_message_at,
        id: lastRow.id,
      })
    }

    return { data, next_cursor }
  }

  @InjectManager()
  async listMessagesCursor(
    conversationId: string,
    pagination: { cursor?: string | null; limit?: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<CursorPaginatedResult<MessageDTO>> {
    const knex = sharedContext!.manager!.getKnex()
    const limit = Math.min(pagination.limit ?? 30, 100)

    let query = knex("message")
      .select("*")
      .where("conversation_id", conversationId)
      .where("deleted_at", null)
      .orderBy("created_at" as any, "desc")
      .orderBy("id" as any, "desc")
      .limit(limit + 1)

    if (pagination.cursor) {
      const decoded = decodeCursor(pagination.cursor)
      if (decoded && decoded.created_at && decoded.id) {
        query = query.where(function () {
          this.where("created_at", "<", decoded.created_at!)
            .orWhere(function () {
              this.where("created_at", "=", decoded.created_at!)
                .andWhere("id", "<", decoded.id!)
            })
        })
      }
    }

    const rows: any[] = await query

    const hasMore = rows.length > limit
    const data = hasMore ? rows.slice(0, limit) : rows

    let next_cursor: string | null = null
    if (hasMore && data.length > 0) {
      const lastRow = data[data.length - 1]
      next_cursor = encodeCursor({
        created_at: lastRow.created_at?.toISOString?.() ?? lastRow.created_at,
        id: lastRow.id,
      })
    }

    return { data, next_cursor }
  }

  @InjectManager()
  async searchConversationsAdmin(
    filter: {
      seller_name?: string
      buyer_name?: string
      date_from?: string
      date_to?: string
      context_type?: string
      context_id?: string
    },
    pagination: { cursor?: string | null; limit?: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<CursorPaginatedResult<ConversationDTO & { seller_name?: string; buyer_name?: string; buyer_email?: string; message_count?: number }>> {
    const knex = sharedContext!.manager!.getKnex()
    const limit = Math.min(pagination.limit ?? 20, 50)

    let query = knex("conversation as c")
      .select(
        "c.*",
        "s.name as seller_name",
        "cust.first_name as buyer_first_name",
        "cust.last_name as buyer_last_name",
        "cust.email as buyer_email"
      )
      .leftJoin(
        "seller_seller_messaging_conversation as sc",
        "sc.conversation_id",
        "c.id"
      )
      .leftJoin("seller as s", "s.id", "sc.seller_id")
      .leftJoin(
        "customer_customer_messaging_conversation as cc",
        "cc.conversation_id",
        "c.id"
      )
      .leftJoin("customer as cust", "cust.id", "cc.customer_id")
      .where("c.deleted_at", null)
      .orderBy("c.last_message_at" as any, "desc")
      .orderBy("c.id" as any, "desc")
      .limit(limit + 1)

    if (filter.seller_name) {
      query = query.whereILike("s.name", `%${escapeLike(filter.seller_name)}%`)
    }

    if (filter.buyer_name) {
      const escaped = escapeLike(filter.buyer_name)
      query = query.where(function () {
        this.whereILike("cust.first_name", `%${escaped}%`)
          .orWhereILike("cust.last_name", `%${escaped}%`)
      })
    }

    if (filter.date_from) {
      query = query.where("c.last_message_at", ">=", filter.date_from)
    }

    if (filter.date_to) {
      query = query.where("c.last_message_at", "<=", filter.date_to)
    }

    if (filter.context_type || filter.context_id) {
      query = query.whereExists(function () {
        this.select(knex.raw("1"))
          .from("message as m")
          .whereRaw("m.conversation_id = c.id")

        if (filter.context_type) {
          this.where("m.context_type", filter.context_type)
        }
        if (filter.context_id) {
          this.where("m.context_id", filter.context_id)
        }
      })
    }

    if (pagination.cursor) {
      const decoded = decodeCursor(pagination.cursor)
      if (decoded && decoded.last_message_at && decoded.id) {
        query = query.where(function () {
          this.where("c.last_message_at", "<", decoded.last_message_at!)
            .orWhere(function () {
              this.where("c.last_message_at", "=", decoded.last_message_at!)
                .andWhere("c.id", "<", decoded.id!)
            })
        })
      }
    }

    const rows: any[] = await query

    const hasMore = rows.length > limit
    const data = (hasMore ? rows.slice(0, limit) : rows).map((row: any) => ({
      ...row,
      buyer_name: [row.buyer_first_name, row.buyer_last_name]
        .filter(Boolean)
        .join(" "),
    }))

    let next_cursor: string | null = null
    if (hasMore && data.length > 0) {
      const lastRow = data[data.length - 1]
      next_cursor = encodeCursor({
        last_message_at: lastRow.last_message_at?.toISOString?.() ?? lastRow.last_message_at,
        id: lastRow.id,
      })
    }

    return { data, next_cursor }
  }

  @InjectManager()
  async getUnreadCountTotal(
    filter: { buyer_id?: string; seller_id?: string },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<number> {
    const knex = sharedContext!.manager!.getKnex()

    const countField = filter.buyer_id
      ? "unread_count_customer"
      : "unread_count_seller"

    let query = knex("conversation")
      .sum({ total: countField })
      .where("deleted_at", null)

    if (filter.buyer_id) {
      query = query.where("buyer_id", filter.buyer_id)
    }

    if (filter.seller_id) {
      query = query.where("seller_id", filter.seller_id)
    }

    const [result] = await query

    return Number(result?.total ?? 0)
  }

  @InjectTransactionManager()
  async createMessageAtomic(
    data: {
      conversation_id: string
      sender_id: string
      sender_type: "customer" | "seller"
      body: string
      context_type?: string | null
      context_id?: string | null
      context_label?: string | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<MessageDTO> {
    const knex = sharedContext!.manager!.getKnex()

    const preview = data.body.substring(0, MAX_PREVIEW_LENGTH)
    const recipientCounterField =
      data.sender_type === "customer"
        ? "unread_count_seller"
        : "unread_count_customer"

    const now = new Date()

    const [message] = await knex("message")
      .insert({
        id: `msg_${generateId()}`,
        conversation_id: data.conversation_id,
        sender_id: data.sender_id,
        sender_type: data.sender_type,
        body: data.body,
        context_type: data.context_type ?? null,
        context_id: data.context_id ?? null,
        context_label: data.context_label ?? null,
        read_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      })
      .returning("*")

    await knex("conversation")
      .where("id", data.conversation_id)
      .update({
        last_message_preview: preview,
        last_message_sender_type: data.sender_type,
        last_message_at: now,
        [recipientCounterField]: knex.raw(`?? + 1`, [recipientCounterField]),
        updated_at: now,
      })

    return message
  }

  @InjectTransactionManager()
  async markMessagesReadAtomic(
    conversationId: string,
    readerType: "customer" | "seller",
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<number> {
    const knex = sharedContext!.manager!.getKnex()

    const senderType = readerType === "customer" ? "seller" : "customer"
    const counterField =
      readerType === "customer"
        ? "unread_count_customer"
        : "unread_count_seller"

    const updated = await knex("message")
      .where("conversation_id", conversationId)
      .where("sender_type", senderType)
      .whereNull("read_at")
      .whereNull("deleted_at")
      .update({
        read_at: new Date(),
        updated_at: new Date(),
      })

    await knex("conversation")
      .where("id", conversationId)
      .update({
        [counterField]: 0,
        updated_at: new Date(),
      })

    return updated
  }
}

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  )
}

export default MessagingModuleService
