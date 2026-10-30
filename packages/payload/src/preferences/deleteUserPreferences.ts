import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Payload } from '../index.js'
import type { PayloadRequest, Where } from '../types/index.js'

import { preferencesCollectionSlug } from './config.js'

type Args = {
  collectionConfig: SanitizedCollectionConfig
  /**
   * User IDs to delete
   */
  ids: (number | string)[]
  payload: Payload
  req: PayloadRequest
}

// Each id binds up to two parameters (user and key), so a batch stays below the 100 bound
// parameters Cloudflare D1 allows per statement
const DELETE_BATCH_SIZE = 40

export const deleteUserPreferences = async ({ collectionConfig, ids, payload, req }: Args) => {
  for (let i = 0; i < ids.length; i += DELETE_BATCH_SIZE) {
    const batch = ids.slice(i, i + DELETE_BATCH_SIZE)

    const documentPreferences: Where = {
      key: { in: batch.map((id) => `collection-${collectionConfig.slug}-${id}`) },
    }

    await payload.db.deleteMany({
      collection: preferencesCollectionSlug,
      req,
      where: collectionConfig.auth
        ? {
            or: [
              // An object `equals` compares only the column of this collection, while
              // `user.value` would compare the ids against one column per auth collection
              ...batch.map((value) => ({
                user: { equals: { relationTo: collectionConfig.slug, value } },
              })),
              documentPreferences,
            ],
          }
        : documentPreferences,
    })
  }
}
