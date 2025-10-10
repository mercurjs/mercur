import { Migration } from '@mikro-orm/migrations';

export class Migration20250324131111 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "configuration_rule" drop constraint if exists "configuration_rule_rule_type_check";`);

    this.addSql(`alter table if exists "configuration_rule" add constraint "configuration_rule_rule_type_check" check("rule_type" in ('global_product_catalog', 'require_product_approval', 'product_request_enabled', 'product_import_enabled'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "configuration_rule" drop constraint if exists "configuration_rule_rule_type_check";`);

    this.addSql(`alter table if exists "configuration_rule" add constraint "configuration_rule_rule_type_check" check("rule_type" in ('global_product_catalog', 'require_product_approval', 'product_request_enabled'));`);
  }

}
