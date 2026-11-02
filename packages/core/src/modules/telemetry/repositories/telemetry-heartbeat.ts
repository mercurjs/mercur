import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { Context } from "@medusajs/framework/types"
import { DALUtils } from "@medusajs/framework/utils"

import { TELEMETRY_INSTALLATION_ID } from "../models"

export class TelemetryHeartbeatRepository extends DALUtils.MikroOrmBase {
  constructor() {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
  }

  /**
   * Conditional update so that, with several replicas sharing one database,
   * exactly one of them sends a heartbeat per interval.
   */
  async claimHeartbeat(minGapSeconds: number, sharedContext: Context = {}): Promise<boolean> {
    const knex = this.getActiveManager<SqlEntityManager>(sharedContext).getKnex()

    const updated = await knex("telemetry_installation")
      .where({ id: TELEMETRY_INSTALLATION_ID })
      .andWhere((qb) => {
        qb.whereNull("last_heartbeat_at").orWhereRaw(
          "last_heartbeat_at <= now() - make_interval(secs => ?)",
          [minGapSeconds],
        )
      })
      .update({ last_heartbeat_at: knex.fn.now(), updated_at: knex.fn.now() })

    return updated > 0
  }
}
