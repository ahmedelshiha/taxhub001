import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/admin/filter-presets/[id]
 * Get a specific filter preset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const preset = await prisma.filter_presets.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Check authorization (public presets or owner)
    if (!preset.isPublic && preset.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      ...preset,
      filterConfig: JSON.parse(preset.filterConfig),
    })
  } catch (error) {
    console.error('Failed to fetch filter preset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preset' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/filter-presets/[id]
 * Update a filter preset
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const preset = await prisma.filter_presets.findUnique({
      where: { id: params.id },
    })

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Only owner can update
    if (preset.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, isPublic, icon, color, filterConfig } = body

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (filterConfig !== undefined) {
      updateData.filterConfig = JSON.stringify(filterConfig)
      updateData.filterLogic = filterConfig.logic || 'AND'
    }

    updateData.updatedAt = new Date()

    // Check if new name already exists (if name is being changed)
    if (name && name !== preset.name) {
      const existing = await prisma.filter_presets.findFirst({
        where: {
          tenantId: preset.tenantId,
          name,
          createdBy: session.user.id,
          NOT: { id: params.id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Another preset with this name already exists' },
          { status: 409 }
        )
      }
    }

    const updatedPreset = await prisma.filter_presets.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      ...updatedPreset,
      filterConfig: JSON.parse(updatedPreset.filterConfig),
    })
  } catch (error) {
    console.error('Failed to update filter preset:', error)
    return NextResponse.json(
      { error: 'Failed to update preset' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/filter-presets/[id]
 * Delete a filter preset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const preset = await prisma.filter_presets.findUnique({
      where: { id: params.id },
    })

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      )
    }

    // Only owner can delete
    if (preset.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    await prisma.filter_presets.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Preset deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete filter preset:', error)
    return NextResponse.json(
      { error: 'Failed to delete preset' },
      { status: 500 }
    )
  }
}
