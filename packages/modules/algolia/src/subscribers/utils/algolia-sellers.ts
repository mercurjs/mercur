import { z } from 'zod'

import { MedusaContainer } from "@medusajs/framework";

import {
  ContainerRegistrationKeys,
  arrayDifference,
} from "@medusajs/framework/utils";

import { AlgoliaSellerValidator, StoreStatus } from '@mercurjs/framework'

export async function filterSellersByStatus(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "store_status"],
    filters: {
      id: ids,
    },
  });

  const actives = sellers.filter((s) => s.store_status === StoreStatus.ACTIVE);
  const other = arrayDifference(sellers, actives);

  return {
    actives: sellers.map((p) => p.id),
    other: other.map((p) => p.id),
  };
}

export async function findAndTransformAlgoliaSellers(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: sellers } = await query.graph({
    entity: 'seller',
    fields: ['id', 'name', 'handle', 'description', 'photo'],
    filters: {
      id: ids
    }
  })

  return z.array(AlgoliaSellerValidator).parse(sellers)
}
