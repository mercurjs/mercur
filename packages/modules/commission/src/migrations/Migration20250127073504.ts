import { Migration } from '@mikro-orm/migrations'

export class Migration20250127073504 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "commission_rate" alter column "percentage_rate" type integer using ("percentage_rate"::integer);'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "percentage_rate" drop not null;'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "price_set_id" type text using ("price_set_id"::text);'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "price_set_id" drop not null;'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "max_price_set_id" type text using ("max_price_set_id"::text);'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "max_price_set_id" drop not null;'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "min_price_set_id" type text using ("min_price_set_id"::text);'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "min_price_set_id" drop not null;'
    )
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "commission_rate" alter column "percentage_rate" type integer using ("percentage_rate"::integer);'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "percentage_rate" set not null;'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "price_set_id" type text using ("price_set_id"::text);'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "price_set_id" set not null;'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "max_price_set_id" type text using ("max_price_set_id"::text);'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "max_price_set_id" set not null;'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "min_price_set_id" type text using ("min_price_set_id"::text);'
    )
    this.addSql(
      'alter table if exists "commission_rate" alter column "min_price_set_id" set not null;'
    )
  }
}
