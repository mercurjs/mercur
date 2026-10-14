import { Migration } from '@medusajs/framework/mikro-orm/migrations';

export class Migration20261013000000 extends Migration {
    override async up(): Promise<void> {
        this.addSql(`
            CREATE TABLE IF NOT EXISTS "spraay_batch" (
                "id" TEXT NOT NULL,
                "status" TEXT NOT NULL DEFAULT 'assembling',
                "treasury_address" TEXT NOT NULL,
                "total_amount" TEXT NOT NULL,
                "fee_amount" TEXT,
                "recipient_count" INTEGER NOT NULL DEFAULT 0,
                "unsigned_tx_to" TEXT,
                "unsigned_tx_data" TEXT,
                "unsigned_tx_value" TEXT,
                "unsigned_tx_chain_id" INTEGER,
                "unsigned_tx_nonce" INTEGER,
                "unsigned_tx_gas" TEXT,
                "prepared_block_number" TEXT,
                "signed_tx_raw" TEXT,
                "tx_hash" TEXT,
                "block_number" TEXT,
                "settled_fee_amount" TEXT,
                "gateway_request" JSONB,
                "gateway_response" JSONB,
                "error_message" TEXT,
                "expires_at" TIMESTAMPTZ,
                "assembled_at" TIMESTAMPTZ,
                "signed_at" TIMESTAMPTZ,
                "broadcast_at" TIMESTAMPTZ,
                "settled_at" TIMESTAMPTZ,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMPTZ,
                CONSTRAINT "spraay_batch_pkey" PRIMARY KEY ("id")
            );
        `);

        this.addSql(`
            CREATE INDEX IF NOT EXISTS "IDX_spraay_batch_status"
                ON "spraay_batch" ("status")
                WHERE "deleted_at" IS NULL;
        `);

        this.addSql(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_spraay_batch_tx_hash"
                ON "spraay_batch" ("tx_hash")
                WHERE "tx_hash" IS NOT NULL AND "deleted_at" IS NULL;
        `);

        this.addSql(`
            CREATE TABLE IF NOT EXISTS "spraay_batch_item" (
                "id" TEXT NOT NULL,
                "payout_id" TEXT NOT NULL,
                "wallet_address" TEXT NOT NULL,
                "amount" TEXT NOT NULL,
                "currency_code" TEXT NOT NULL DEFAULT 'usdc',
                "released_at" TIMESTAMPTZ,
                "batch_id" TEXT NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMPTZ,
                CONSTRAINT "spraay_batch_item_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "spraay_batch_item_batch_id_fkey"
                    FOREIGN KEY ("batch_id") REFERENCES "spraay_batch" ("id")
                    ON UPDATE CASCADE ON DELETE CASCADE
            );
        `);

        this.addSql(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_spraay_batch_item_payout_id"
                ON "spraay_batch_item" ("payout_id")
                WHERE "deleted_at" IS NULL AND "released_at" IS NULL;
        `);

        this.addSql(`
            CREATE INDEX IF NOT EXISTS "IDX_spraay_batch_item_wallet_address"
                ON "spraay_batch_item" ("wallet_address")
                WHERE "deleted_at" IS NULL;
        `);

        this.addSql(`
            CREATE INDEX IF NOT EXISTS "IDX_spraay_batch_item_batch_id"
                ON "spraay_batch_item" ("batch_id")
                WHERE "deleted_at" IS NULL;
        `);
    }

    override async down(): Promise<void> {
        this.addSql(`DROP TABLE IF EXISTS "spraay_batch_item" CASCADE;`);
        this.addSql(`DROP TABLE IF EXISTS "spraay_batch" CASCADE;`);
    }
}
