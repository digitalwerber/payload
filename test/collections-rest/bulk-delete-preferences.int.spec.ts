import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './config.js'

const preferencesSlug = 'payload-preferences'

test.suite('Collections REST - bulk delete preferences', { config: './config.ts' }, () => {
  // Cloudflare D1 caps a statement at 100 bound parameters
  test('should delete the preferences of a batch that exceeds the bound parameter limit of D1', async ({
    payload,
  }) => {
    const owner = await payload.create({
      collection: 'users',
      data: {
        email: 'bulk-delete-preferences@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    const user = { ...owner, collection: 'users' as const }

    const ids: (number | string)[] = []

    for (let i = 0; i < 120; i++) {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: `bulk delete preferences ${i}` },
        overrideAccess: true,
      })

      await payload.create({
        collection: preferencesSlug,
        data: {
          key: `collection-${postsSlug}-${post.id}`,
          user: { relationTo: 'users', value: owner.id },
          value: {},
        },
        user,
      })

      ids.push(post.id)
    }

    const unrelatedPreference = await payload.create({
      collection: preferencesSlug,
      data: {
        key: `collection-${postsSlug}`,
        user: { relationTo: 'users', value: owner.id },
        value: {},
      },
      user,
    })

    const { docs, errors } = await payload.delete({
      collection: postsSlug,
      where: {
        id: { in: ids },
      },
      overrideAccess: true,
    })

    expect(errors).toHaveLength(0)
    expect(docs).toHaveLength(ids.length)

    const { docs: remainingPreferences } = await payload.find({
      collection: preferencesSlug,
      depth: 0,
      limit: 0,
      overrideAccess: true,
    })

    expect(remainingPreferences.map(({ id }) => id)).toStrictEqual([unrelatedPreference.id])
  })
})
