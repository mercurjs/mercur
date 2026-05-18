import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260422112250 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "product_attribute_value_link" ("product_id" text not null, "product_attribute_value_id" text not null, constraint "product_attribute_value_link_pkey" primary key ("product_id", "product_attribute_value_id"));`);

    this.addSql(`alter table if exists "product_attribute_value_link" add constraint "product_attribute_value_link_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_attribute_value_link" add constraint "product_attribute_value_link_product_attribute_value_id_foreign" foreign key ("product_attribute_value_id") references "product_attribute_value" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "product_attribute_value_link" cascade;`);
  }

}
