import { Migration } from '@mikro-orm/migrations';

export class Migration20250918080805 extends Migration {

    override async up(): Promise<void> {
        this.addSql(`alter table if exists "attribute" drop column if exists "is_global";`);
    }

    override async down(): Promise<void> {
        this.addSql(`alter table if exists "attribute" add column if not exists "is_global" boolean not null default false;`);
    }

}
