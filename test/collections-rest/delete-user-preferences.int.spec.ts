import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

const preferencesSlug = 'payload-preferences'

test.suite('Collections REST - delete user preferences', { config: './config.ts' }, () => {
  test('should delete the preferences of a deleted user', async ({ payload }) => {
    const owner = await payload.create({
      collection: 'users',
      data: {
        email: 'delete-user-preferences@payloadcms.com',
        password: 'test',
      },
      overrideAccess: true,
    })

    const user = { ...owner, collection: 'users' as const }

    for (const key of ['nav', 'locale', `collection-${preferencesSlug}`]) {
      await payload.create({
        collection: preferencesSlug,
        data: {
          key,
          user: { relationTo: 'users', value: owner.id },
          value: {},
        },
        user,
      })
    }

    const { docs, errors } = await payload.delete({
      collection: 'users',
      where: {
        id: { equals: owner.id },
      },
      overrideAccess: true,
    })

    expect(errors).toHaveLength(0)
    expect(docs).toHaveLength(1)

    const { totalDocs } = await payload.db.count({ collection: preferencesSlug })

    expect(totalDocs).toBe(0)
  })
})
