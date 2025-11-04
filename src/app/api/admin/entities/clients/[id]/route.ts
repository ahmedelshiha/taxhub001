import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { withTenantContext } from '@/lib/api-wrapper'
import { requireTenantContext } from '@/lib/tenant-utils'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const addDeprecationHeaders = (response: NextResponse) => {
  response.headers.set('Deprecation', 'true')
  response.headers.set('Sunset', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString())
  response.headers.set('Link', '</api/admin/users>; rel="successor"')
  response.headers.set('X-API-Warn', 'This endpoint is deprecated. Please use /api/admin/users instead.')
  return response
}

export const GET = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_VIEW)) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    if (!ctx.tenantId) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Tenant context missing' }, { status: 400 }))
    }

    const client = await prisma.user.findFirst({
      where: {
        id: params.id,
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
    })

    if (!client) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Client not found' }, { status: 404 }))
    }

    return addDeprecationHeaders(NextResponse.json(client))
  } catch (err) {
    console.error('GET /api/admin/entities/clients/[id] error', err)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
})

export const PATCH = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
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
    const { name, email } = body || {}

    const client = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'CLIENT',
        tenantId: ctx.tenantId,
      },
    })

    if (!client) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Client not found' }, { status: 404 }))
    }

    // Check if new email is available (if changed)
    if (email && email !== client.email) {
      const existing = await prisma.user.findUnique({
        where: { tenantId_email: { tenantId: ctx.tenantId, email } },
      })
      if (existing) {
        return addDeprecationHeaders(NextResponse.json({ error: 'Email already in use' }, { status: 409 }))
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return addDeprecationHeaders(NextResponse.json(updated))
  } catch (err) {
    console.error('PATCH /api/admin/entities/clients/[id] error', err)
    return addDeprecationHeaders(NextResponse.json({ error: 'Failed to update client' }, { status: 500 }))
  }
})

export const DELETE = withTenantContext(async (req: Request, { params }: { params: { id: string } }) => {
  try {
    const ctx = requireTenantContext()
    const role = ctx.role ?? undefined
    if (!hasPermission(role, PERMISSIONS.USERS_MANAGE)) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

    if (!ctx.tenantId) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Tenant context missing' }, { status: 400 }))
    }

    const client = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'CLIENT',
        tenantId: ctx.tenantId,
      },
    })

    if (!client) {
      return addDeprecationHeaders(NextResponse.json({ error: 'Client not found' }, { status: 404 }))
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return addDeprecationHeaders(NextResponse.json({ success: true }))
  } catch (err) {
    console.error('DELETE /api/admin/entities/clients/[id] error', err)
    return addDeprecationHeaders(NextResponse.json({ error: 'Failed to delete client' }, { status: 500 }))
  }
})
