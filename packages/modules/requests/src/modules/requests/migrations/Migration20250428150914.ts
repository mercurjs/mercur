import { Migration } from '@mikro-orm/migrations';

export class Migration20250428150914 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "request" drop constraint if exists "request_status_check";`);

    this.addSql(`alter table if exists "request" add constraint "request_status_check" check("status" in ('draft', 'pending', 'accepted', 'rejected'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "request" drop constraint if exists "request_status_check";`);

    this.addSql(`alter table if exists "request" add constraint "request_status_check" check("status" in ('pending', 'accepted', 'rejected'));`);
  }

}
