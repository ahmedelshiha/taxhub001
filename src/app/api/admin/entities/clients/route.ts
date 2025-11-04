import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const addDeprecationHeaders = (response: NextResponse) => {
  response.headers.set('Deprecation', 'true')
  response.headers.set('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString())
  response.headers.set('Link', '</api/admin/users?role=CLIENT>; rel="successor"')
  response.headers.set('X-API-Warn', 'This endpoint is deprecated. Please use /api/admin/users with role=CLIENT filter instead.')
  return response
}

export const GET = withTenantContext(async () => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_VIEW)) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    if (!ctx.tenantId) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Tenant context missing' }, { status: 400 }))
    }

    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        tenantId: ctx.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return addDeprecationHeaders(NextResponse.json({ clients }))
  } catch (err) {
    console.error('GET /api/admin/entities/clients error', err)
    return NextResponse.json({ error: 'Failed to list clients' }, { status: 500 })
  }
})

export const POST = withTenantContext(async (req: Request) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    if (!ctx.tenantId) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Tenant context missing' }, { status: 400 }))
    }

    const body = await req.json().catch(() => ({}))
    const { name, email, tier, status } = body || {}

    if (!name || !email) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Name and email are required' }, { status: 400 }))
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId: ctx.tenantId, email } },
    })

    if (existing) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Email already exists' }, { status: 409 }))
    }

    const client = await prisma.user.create({
      data: {
        name,
        email,
        role: 'CLIENT',
        tenantId: ctx.tenantId,
        emailVerified: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    return addDeprecationHeaders(NextResponse.json(client, { status: 201 }))
  } catch (err) {
    console.error('POST /api/admin/entities/clients error', err)
    return addDeprecationHeaders(NextResponse.json({ error: 'Failed to create client' }, { status: 500 }))
  }
})
