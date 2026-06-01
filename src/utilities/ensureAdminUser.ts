import type { Payload } from 'payload'

import { getAdminCredentials } from '@/constants/adminUser'
import type { User } from '@/payload-types'

/**
 * Ensures the website admin user exists with the admin role.
 */
export async function ensureAdminUser(payload: Payload): Promise<void> {
  const { email, password } = getAdminCredentials()

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

  if (existing.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: adminData,
    })
    return
  }

  await payload.update({
    collection: 'users',
    id: existing.docs[0].id,
    data: adminData,
  })
}
