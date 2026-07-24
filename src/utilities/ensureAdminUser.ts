import type { Payload } from 'payload'

import { getAdminCredentials } from '@/constants/adminUser'
import type { User } from '@/payload-types'

/**
 * Ensures the website admin user exists with the admin role.
 */
export async function ensureAdminUser(payload: Payload): Promise<void> {
  const { email, password } = getAdminCredentials()

  payload.logger.info('Checking admin user...')

  const existing = await payload.find({
    collection: 'users',
    limit: 1,
    where: {
      email: {
        equals: email,
      },
    },
  })

  const adminData: Pick<User, 'email' | 'name' | 'password' | 'roles'> = {
    email,
    name: 'Admin',
    password,
    roles: ['admin'],
  }

  payload.logger.info('Existing admin user...')
  console.dir(existing, { depth: null })

  if (existing.docs.length === 0) {
    payload.logger.info('Creating admin...')
    await payload.create({
      collection: 'users',
      data: adminData,
    })
    return
  }

  payload.logger.info('Updating admin...')

  await payload.update({
    collection: 'users',
    id: existing.docs[0].id,
    data: adminData,
  })
}
